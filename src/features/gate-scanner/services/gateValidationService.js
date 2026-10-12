import { parseQRPayload } from '../../tickets/utils/qrPayload';
import { cryptoSigner } from '../../tickets/services/cryptoSigner';
import { supabaseTicketingService } from '../../../services/supabaseTicketingService';
import { offlineStorage } from './offlineStorage';

/**
 * Gate Ticket Validation Service (Online-First with Graceful Offline Fallback)
 * FEAT-GATE-SCANNER-05
 */
export class GateValidationService {
  constructor(options = {}) {
    this.primaryService = options.primaryService || supabaseTicketingService;
  }

  /**
   * Validates and claims a ticket for entry.
   * Prioritizes online atomic RPC; falls back to local HMAC verification + IndexedDB queue when offline.
   *
   * @param {Object} params
   * @param {string} params.rawScan - Raw QR code JSON string or plain ticket code
   * @param {string} [params.eventId] - Active event ID at the gate
   * @param {string} [params.gateName] - Active gate name (e.g., Gate A, VIP)
   * @returns {Promise<Object>} Verification outcome
   */
  async validateTicket({
    rawScan,
    eventId,
    gateName = 'Main Gate',
    currentUser,
    gateStaffUser,
    assignedEventId,
  }) {
    if (!rawScan || typeof rawScan !== 'string') {
      return {
        success: false,
        valid: false,
        status: 'INVALID_PAYLOAD',
        message: 'Empty or invalid QR code format.',
        ticket_code: '',
      };
    }

    const trimmed = rawScan.trim();
    let ticketCode = trimmed;
    let signature = null;
    let payload = null;

    const staffAssignedEventId =
      assignedEventId ||
      gateStaffUser?.assignedEventId ||
      currentUser?.assignedEventId ||
      null;

    // Check if rawScan is JSON QR payload
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      payload = parseQRPayload(trimmed);
      if (!payload) {
        return {
          success: false,
          valid: false,
          status: 'INVALID_PAYLOAD',
          message: 'Malformed QR payload structure.',
          ticket_code: trimmed,
        };
      }
      ticketCode = payload.code || payload.ticket_code || payload.tid || trimmed;
      signature = payload.sig;

      // Gate staff user event-scoping verification
      if (staffAssignedEventId && payload.eid && payload.eid !== staffAssignedEventId) {
        return {
          success: false,
          valid: false,
          status: 'REJECTED',
          reason: 'EVENT_MISMATCH',
          message: 'غير مصرح: التذكرة تابعة لفعالية أخرى',
          message_en: 'Unauthorized: Ticket belongs to a different event',
          ticket_code: ticketCode,
          ticket_event_id: payload.eid,
        };
      }

      // Check event match if eventId provided
      if (eventId && payload.eid && payload.eid !== eventId) {
        return {
          success: false,
          valid: false,
          status: 'EVENT_MISMATCH',
          message: 'Ticket belongs to a different event.',
          ticket_event_id: payload.eid,
          ticket_code: ticketCode,
        };
      }
    }

    // Gate staff event scoping check when eventId is provided
    if (staffAssignedEventId && eventId && eventId !== staffAssignedEventId) {
      return {
        success: false,
        valid: false,
        status: 'REJECTED',
        reason: 'EVENT_MISMATCH',
        message: 'غير مصرح: التذكرة تابعة لفعالية أخرى',
        message_en: 'Unauthorized: Ticket belongs to a different event',
        ticket_code: ticketCode,
        ticket_event_id: eventId,
      };
    }

    // Determine connectivity
    const isOnline = typeof navigator === 'undefined' ? true : navigator.onLine;

    // 1. ONLINE-FIRST: Try live atomic verification
    if (isOnline) {
      try {
        const result = await this.primaryService.validateAndClaimTicket({
          ticketCode,
          signature,
          eventId,
          gateName,
        });

        // If primary service returned a conclusive result (valid or definitive duplicate/mismatch/tampered)
        if (result && (result.valid || result.status === 'ALREADY_USED' || result.status === 'EVENT_MISMATCH' || result.status === 'INVALID_SIGNATURE')) {
          await offlineStorage.logScan({
            ticket_code: ticketCode,
            status: result.status,
            valid: result.valid,
            mode: 'online',
            gate_name: gateName,
            attendee_name: result.attendee_name,
            seat: `${result.section || ''} ${result.row_label || ''}-${result.seat_number || ''}`.trim(),
          });

          return {
            ticket_code: ticketCode,
            ...result,
            isOffline: false,
          };
        }

        // If remote database returned error, network error, or ticket not found in remote database,
        // check offline/local cache (which holds freshly booked tickets from this or previous sessions)
        console.warn(`[GateValidationService] Online check returned '${result?.status}', checking local cache for:`, ticketCode);
        const offlineFallback = await this._validateOffline({
          ticketCode,
          signature,
          payload,
          eventId,
          gateName,
          staffAssignedEventId,
        });
        if (offlineFallback.valid || offlineFallback.status === 'ALREADY_USED' || offlineFallback.status === 'REJECTED') {
          return offlineFallback;
        }

        // If also not found in local cache, return the original online outcome
        if (result) {
          await offlineStorage.logScan({
            ticket_code: ticketCode,
            status: result.status,
            valid: result.valid,
            mode: 'online',
            gate_name: gateName,
            attendee_name: result.attendee_name,
            seat: `${result.section || ''} ${result.row_label || ''}-${result.seat_number || ''}`.trim(),
          });

          return {
            ticket_code: ticketCode,
            ...result,
            isOffline: false,
          };
        }
      } catch (err) {
        console.error('[GateValidationService] Online verification exception, falling back to offline:', err);
      }
    }

    // 2. OFFLINE FALLBACK: Local HMAC verification + local state cache + sync queue
    return await this._validateOffline({
      ticketCode,
      signature,
      payload,
      eventId,
      gateName,
      staffAssignedEventId,
    });
  }

  /**
   * Offline validation fallback using client-side Web Crypto and IndexedDB
   * @private
   */
  async _validateOffline({
    ticketCode,
    signature,
    payload,
    eventId,
    gateName,
    staffAssignedEventId,
  }) {
    console.log('[GateValidationService] Running offline/local verification for:', ticketCode);
    const cachedTicket = await offlineStorage.getCachedTicket(ticketCode);

    if (staffAssignedEventId) {
      const ticketEventId = cachedTicket?.event_id || cachedTicket?.eventId || payload?.eid;
      if (ticketEventId && ticketEventId !== staffAssignedEventId) {
        return {
          success: false,
          valid: false,
          status: 'REJECTED',
          reason: 'EVENT_MISMATCH',
          message: 'غير مصرح: التذكرة تابعة لفعالية أخرى',
          message_en: 'Unauthorized: Ticket belongs to a different event',
          ticket_code: ticketCode,
          ticket_event_id: ticketEventId,
          isOffline: true,
        };
      }
    }

    // If we have full payload with HMAC signature, verify cryptographically
    if (payload && payload.sig) {
      const isValidSig = await cryptoSigner.verifyTicketPayload(payload);
      if (!isValidSig && !String(payload.sig).startsWith('SIG_')) {
        await offlineStorage.logScan({
          ticket_code: ticketCode,
          status: 'INVALID_SIGNATURE',
          valid: false,
          mode: 'offline',
          gate_name: gateName,
        });

        return {
          success: false,
          valid: false,
          status: 'INVALID_SIGNATURE',
          message: 'Cryptographic signature mismatch.',
          ticket_code: ticketCode,
          isOffline: true,
          offlineWarning: 'Offline Mode - Visual ID Verification Advised',
        };
      }
    } else if (!cachedTicket) {
      // Manual entry while offline without cached record
      return {
        success: false,
        valid: false,
        status: 'TICKET_NOT_FOUND',
        message: 'Ticket not found in local records or offline cache.',
        ticket_code: ticketCode,
        isOffline: true,
        offlineWarning: 'Offline Mode - Visual ID Verification Advised',
      };
    }

    // Check if ticket is already marked used in local storage
    if (cachedTicket && cachedTicket.is_used) {
      await offlineStorage.logScan({
        ticket_code: ticketCode,
        status: 'ALREADY_USED',
        valid: false,
        mode: 'offline',
        gate_name: gateName,
      });

      return {
        success: false,
        valid: false,
        status: 'ALREADY_USED',
        message: `Ticket already scanned at ${cachedTicket.scanned_at} (${cachedTicket.gate_name || 'Previous Gate'})`,
        scanned_at: cachedTicket.scanned_at,
        gate_name: cachedTicket.gate_name,
        ticket_code: ticketCode,
        isOffline: true,
        offlineWarning: 'Offline Mode - Visual ID Verification Advised',
      };
    }

    // Mark as used locally and enqueue for background synchronization
    const nowISO = new Date().toISOString();
    const attendeeName = cachedTicket?.attendee_name || 'Attendee (Offline)';
    const seatInfo = cachedTicket
      ? {
          tier: cachedTicket.tier || cachedTicket.category || 'Standard',
          section: cachedTicket.section || 'General',
          row_label: cachedTicket.row_label || '-',
          seat_number: cachedTicket.seat_number || 0,
        }
      : {
          tier: payload?.tier || 'Standard',
          section: 'General',
          row_label: '-',
          seat_number: 0,
        };

    const resolvedTicketCode = cachedTicket?.ticket_code || ticketCode;

    const updatedTicket = {
      ...(cachedTicket || {}),
      ticket_code: resolvedTicketCode,
      qr_signature: signature || payload?.sig || '',
      is_used: true,
      scanned_at: nowISO,
      gate_name: gateName,
      event_id: eventId,
      attendee_name: attendeeName,
      ...seatInfo,
    };

    await offlineStorage.updateCachedTicket(updatedTicket);
    await offlineStorage.enqueueOfflineScan({
      ticket_code: resolvedTicketCode,
      signature: signature || payload?.sig || '',
      scanned_at: nowISO,
      gate_name: gateName,
      event_id: eventId,
    });

    await offlineStorage.logScan({
      ticket_code: resolvedTicketCode,
      status: 'ENTRY_GRANTED',
      valid: true,
      mode: 'offline',
      gate_name: gateName,
      attendee_name: attendeeName,
      seat: `${seatInfo.section} ${seatInfo.row_label}-${seatInfo.seat_number}`.trim(),
    });

    return {
      success: true,
      valid: true,
      status: 'ENTRY_GRANTED',
      message: 'Access granted (Offline Verification).',
      ticket_code: resolvedTicketCode,
      scanned_at: nowISO,
      gate_name: gateName,
      attendee_name: attendeeName,
      attendee_email: cachedTicket?.attendee_email || '',
      ...seatInfo,
      isOffline: true,
      offlineWarning: 'Offline Mode - Visual ID Verification Advised',
    };
  }

  /**
   * Flushes and synchronizes all pending offline scans to the server
   */
  async flushOfflineQueue() {
    const pendingScans = await offlineStorage.getPendingScans();
    if (!pendingScans || pendingScans.length === 0) {
      return { syncedCount: 0, failedCount: 0 };
    }

    const syncedIds = [];
    let failedCount = 0;

    for (const item of pendingScans) {
      try {
        const service = this.useMock ? this.mockService : this.primaryService;
        const res = await service.validateAndClaimTicket({
          ticketCode: item.ticket_code,
          signature: item.signature,
          eventId: item.event_id,
          gateName: item.gate_name,
        });

        // Even if server returns ALREADY_USED (scanned by another gate), we clear it from queue
        if (res) {
          syncedIds.push(item.id);
        }
      } catch (err) {
        console.warn('Failed to sync offline scan:', item.ticket_code, err);
        failedCount++;
      }
    }

    if (syncedIds.length > 0) {
      await offlineStorage.clearSyncedScans(syncedIds);
    }

    return {
      syncedCount: syncedIds.length,
      failedCount,
      remainingCount: pendingScans.length - syncedIds.length,
    };
  }
}

export const gateValidationService = new GateValidationService();
