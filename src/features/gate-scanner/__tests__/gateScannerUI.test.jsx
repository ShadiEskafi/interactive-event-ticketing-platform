import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CameraScanner } from '../components/CameraScanner';
import { ScanResultOverlay } from '../components/ScanResultOverlay';
import { GateStatsBar } from '../components/GateStatsBar';
import { ManualEntryModal } from '../components/ManualEntryModal';
import { GateSelectorModal } from '../components/GateSelectorModal';

describe('Gate Scanner UI Components (FEAT-GATE-SCANNER-05)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

    it('renders ALREADY_USED card with original scan time and gate name', () => {
      const mockResult = {
        valid: false,
        status: 'ALREADY_USED',
        message: 'Ticket has already been scanned.',
        scanned_at: '2026-10-10T09:15:00Z',
        gate_name: 'Gate A (North Entrance)',
        ticket_code: 'TKT-10029',
      };

      render(<ScanResultOverlay result={mockResult} onClose={vi.fn()} />);

      expect(screen.getByTestId('result-title')).toHaveTextContent('ALREADY USED');
      expect(screen.getByTestId('result-gate-name')).toHaveTextContent('Gate A (North Entrance)');
      expect(screen.getByTestId('result-scanned-at')).toBeDefined();
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
  });

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

