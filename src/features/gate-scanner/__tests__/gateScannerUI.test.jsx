import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CameraScanner } from '../components/CameraScanner';
import { ScanResultOverlay } from '../components/ScanResultOverlay';
import { GateStatsBar } from '../components/GateStatsBar';
import { ManualEntryModal } from '../components/ManualEntryModal';
import { GateSelectorModal } from '../components/GateSelectorModal';
import { getThemeForStatus, getAutoDismissDelay, SCAN_RESULT_THEMES } from '../scanResultThemes';

describe('Gate Scanner UI Components (FEAT-GATE-SCANNER-05)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Theme System Unit Tests ────────────────────────────────
  describe('scanResultThemes', () => {
    it('returns correct theme for each known status', () => {
      expect(getThemeForStatus('ENTRY_GRANTED').key).toBe('success');
      expect(getThemeForStatus('ALREADY_USED').key).toBe('duplicate');
      expect(getThemeForStatus('INVALID_SIGNATURE').key).toBe('security');
      expect(getThemeForStatus('EVENT_MISMATCH').key).toBe('mismatch');
      expect(getThemeForStatus('TICKET_NOT_FOUND').key).toBe('notfound');
    });

    it('returns FALLBACK theme for unknown statuses', () => {
      expect(getThemeForStatus('SOME_RANDOM_STATUS').key).toBe('error');
      expect(getThemeForStatus('UNKNOWN').key).toBe('error');
      expect(getThemeForStatus(undefined).key).toBe('error');
    });

    it('provides correct auto-dismiss delays per status', () => {
      expect(getAutoDismissDelay('ENTRY_GRANTED')).toBe(1800);
      expect(getAutoDismissDelay('ALREADY_USED')).toBe(4000);
      expect(getAutoDismissDelay('INVALID_SIGNATURE')).toBe(6000);
      expect(getAutoDismissDelay('EVENT_MISMATCH')).toBe(3000);
      expect(getAutoDismissDelay('TICKET_NOT_FOUND')).toBe(2500);
    });

    it('every theme has all required fields', () => {
      const requiredFields = [
        'key', 'cssClass', 'icon', 'iconBgClass', 'title',
        'animationClass', 'autoDismissDelay', 'ariaLabel', 'ariaLive',
        'progressBarClass', 'btnClass', 'btnLabel',
      ];
      Object.values(SCAN_RESULT_THEMES).forEach((theme) => {
        requiredFields.forEach((field) => {
          expect(theme).toHaveProperty(field);
        });
      });
    });
  });

  // ─── ScanResultOverlay ──────────────────────────────────────
  describe('ScanResultOverlay', () => {
    it('renders ENTRY_GRANTED card with attendee and seat metadata', () => {
      const mockResult = {
        valid: true,
        status: 'ENTRY_GRANTED',
        message: 'Access granted.',
        attendee_name: 'John Smith',
        tier: 'VIP',
        section: 'Orchestra',
        row_label: 'A',
        seat_number: 12,
        ticket_code: 'TKT-10029',
      };

      render(<ScanResultOverlay result={mockResult} onClose={vi.fn()} />);

      expect(screen.getByTestId('result-title')).toHaveTextContent('ENTRY GRANTED');
      expect(screen.getByTestId('result-attendee-name')).toHaveTextContent('John Smith');
      expect(screen.getByTestId('result-tier')).toHaveTextContent('VIP');
      expect(screen.getByTestId('result-section')).toHaveTextContent('Orchestra');
      expect(screen.getByTestId('result-seat')).toHaveTextContent('12');
    });

    it('applies success theme classes and animation', () => {
      const mockResult = {
        valid: true,
        status: 'ENTRY_GRANTED',
        message: 'Access granted.',
      };

      render(<ScanResultOverlay result={mockResult} onClose={vi.fn()} />);

      const overlay = screen.getByTestId('scan-result-overlay');
      expect(overlay.className).toContain('result-success');
      expect(overlay.className).toContain('anim-success-glow');
    });

    it('renders ALREADY_USED card with duplicate warning and scan details', () => {
      const mockResult = {
        valid: false,
        status: 'ALREADY_USED',
        message: 'Ticket has already been scanned.',
        scanned_at: '2026-10-10T09:15:00Z',
        gate_name: 'Gate A (North Entrance)',
        ticket_code: 'TKT-10029',
      };

      render(<ScanResultOverlay result={mockResult} onClose={vi.fn()} />);

      expect(screen.getByTestId('result-title')).toHaveTextContent('ALREADY SCANNED');
      expect(screen.getByTestId('result-gate-name')).toHaveTextContent('Gate A (North Entrance)');
      expect(screen.getByTestId('result-scanned-at')).toBeDefined();
      expect(screen.getByTestId('duplicate-details')).toBeDefined();

      const overlay = screen.getByTestId('scan-result-overlay');
      expect(overlay.className).toContain('result-duplicate');
      expect(overlay.className).toContain('anim-warning-shake');
    });

    it('renders INVALID_SIGNATURE with security alert box and danger flash', () => {
      const mockResult = {
        valid: false,
        status: 'INVALID_SIGNATURE',
        message: 'Cryptographic signature mismatch.',
        ticket_code: 'FAKE-001',
      };

      render(<ScanResultOverlay result={mockResult} onClose={vi.fn()} />);

      expect(screen.getByTestId('result-title')).toHaveTextContent('SECURITY ALERT');
      expect(screen.getByTestId('security-details')).toBeDefined();

      const overlay = screen.getByTestId('scan-result-overlay');
      expect(overlay.className).toContain('result-security');
      expect(overlay.className).toContain('anim-danger-flash');
    });

    it('renders EVENT_MISMATCH with mismatch alert box', () => {
      const mockResult = {
        valid: false,
        status: 'EVENT_MISMATCH',
        message: 'Ticket belongs to a different event.',
        ticket_event_id: 'evt-other-2026',
      };

      render(<ScanResultOverlay result={mockResult} onClose={vi.fn()} />);

      expect(screen.getByTestId('result-title')).toHaveTextContent('WRONG EVENT');
      expect(screen.getByTestId('mismatch-details')).toBeDefined();

      const overlay = screen.getByTestId('scan-result-overlay');
      expect(overlay.className).toContain('result-mismatch');
    });

    it('renders TICKET_NOT_FOUND with not-found alert box', () => {
      const mockResult = {
        valid: false,
        status: 'TICKET_NOT_FOUND',
        message: 'Ticket code does not exist.',
        ticket_code: 'TKT-UNKNOWN',
      };

      render(<ScanResultOverlay result={mockResult} onClose={vi.fn()} />);

      expect(screen.getByTestId('result-title')).toHaveTextContent('TICKET NOT FOUND');
      expect(screen.getByTestId('notfound-details')).toBeDefined();

      const overlay = screen.getByTestId('scan-result-overlay');
      expect(overlay.className).toContain('result-notfound');
    });

    it('renders generic error fallback for unknown statuses', () => {
      const mockResult = {
        valid: false,
        status: 'SOME_WEIRD_ERROR',
        message: 'Something went wrong.',
        ticket_code: 'TKT-ERR',
      };

      render(<ScanResultOverlay result={mockResult} onClose={vi.fn()} />);

      expect(screen.getByTestId('result-title')).toHaveTextContent('INVALID TICKET');
      expect(screen.getByTestId('generic-error-details')).toBeDefined();

      const overlay = screen.getByTestId('scan-result-overlay');
      expect(overlay.className).toContain('result-error');
    });

    it('renders offline warning pill when isOffline is true', () => {
      const mockResult = {
        valid: true,
        status: 'ENTRY_GRANTED',
        message: 'Access granted.',
        isOffline: true,
        offlineWarning: 'Offline Mode - Visual ID Verification Advised',
      };

      render(<ScanResultOverlay result={mockResult} onClose={vi.fn()} />);

      expect(screen.getByTestId('scan-offline-pill')).toHaveTextContent('Offline Mode - Visual ID Verification Advised');
    });

    it('uses correct ARIA role and label for accessibility', () => {
      const mockResult = {
        valid: false,
        status: 'INVALID_SIGNATURE',
        message: 'Tampered.',
      };

      render(<ScanResultOverlay result={mockResult} onClose={vi.fn()} />);

      const overlay = screen.getByTestId('scan-result-overlay');
      expect(overlay.getAttribute('role')).toBe('alertdialog');
      expect(overlay.getAttribute('aria-label')).toBe('Danger: Tampered Ticket Detected');
    });

    it('displays themed status icon inside circular wrapper', () => {
      const mockResult = {
        valid: true,
        status: 'ENTRY_GRANTED',
        message: 'Access granted.',
      };

      render(<ScanResultOverlay result={mockResult} onClose={vi.fn()} />);

      const icon = screen.getByTestId('result-icon');
      expect(icon).toHaveTextContent('✅');
      expect(icon.parentElement.className).toContain('icon-bg-success');
    });

    it('returns null when result is null', () => {
      const { container } = render(<ScanResultOverlay result={null} onClose={vi.fn()} />);
      expect(container.innerHTML).toBe('');
    });
  });

  // ─── GateStatsBar ───────────────────────────────────────────
  describe('GateStatsBar', () => {
    it('displays counters and triggers manual entry and gate selection', () => {
      const onOpenManual = vi.fn();
      const onChangeGate = vi.fn();

      render(
        <GateStatsBar
          gateName="Gate B (South Entrance)"
          onChangeGate={onChangeGate}
          onOpenManualEntry={onOpenManual}
          stats={{ admitted: 42, rejected: 3, total: 45 }}
          isOnline={true}
          pendingSyncCount={0}
        />
      );

      expect(screen.getByTestId('metric-admitted')).toHaveTextContent('42');
      expect(screen.getByTestId('metric-rejected')).toHaveTextContent('3');
      expect(screen.getByTestId('btn-select-gate')).toHaveTextContent('Gate B (South Entrance)');

      fireEvent.click(screen.getByTestId('btn-manual-entry-modal'));
      expect(onOpenManual).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByTestId('btn-select-gate'));
      expect(onChangeGate).toHaveBeenCalledTimes(1);
    });
  });

  // ─── ManualEntryModal ───────────────────────────────────────
  describe('ManualEntryModal', () => {
    it('submits typed ticket code on form submit', () => {
      const onSubmit = vi.fn();
      const onClose = vi.fn();

      render(
        <ManualEntryModal
          isOpen={true}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      );

      const input = screen.getByTestId('input-manual-ticket-code');
      fireEvent.change(input, { target: { value: 'TKT-99881' } });

      fireEvent.click(screen.getByTestId('btn-submit-manual-code'));
      expect(onSubmit).toHaveBeenCalledWith('TKT-99881');
    });
  });

  // ─── GateSelectorModal ─────────────────────────────────────
  describe('GateSelectorModal', () => {
    it('allows changing checkpoint gate and confirms selection', () => {
      const onSelectGate = vi.fn();
      const onClose = vi.fn();

      render(
        <GateSelectorModal
          isOpen={true}
          onClose={onClose}
          currentGate="Gate A (North Entrance)"
          onSelectGate={onSelectGate}
        />
      );

      fireEvent.click(screen.getByTestId('gate-option-gate-vip'));
      fireEvent.click(screen.getByTestId('btn-confirm-gate'));

      expect(onSelectGate).toHaveBeenCalledWith('VIP & Press Turnstile');
    });
  });

  // ─── CameraScanner Lifecycle ────────────────────────────────
  describe('CameraScanner Lifecycle & StrictMode Resilience', () => {
    it('mounts cleanly and handles immediate unmounting without uncaught errors', () => {
      const onScan = vi.fn();
      const { unmount } = render(<CameraScanner onScan={onScan} />);

      expect(screen.getByTestId('camera-scanner-container')).toBeInTheDocument();

      // Immediate unmount (simulates React StrictMode fast unmount/remount)
      expect(() => {
        unmount();
      }).not.toThrow();
    });
  });
});
