import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  useSeatHold,
  useHoldLifecycle,
  getOrCreateAnonymousSessionId,
  persistPendingBooking,
  clearPendingBooking,
  HoldTimer,
} from '../../src/features/hold';
import { mockTicketingService } from '../../src/features/seatmap/services/mockTicketingService';

describe('Hold Hardening: Anonymous Sessions, Hold Transfer & Teardown Lifecycle', () => {
  beforeEach(() => {
    mockTicketingService.resetState();
    window.sessionStorage.clear();
    vi.clearAllMocks();
  });

  describe('1. Anonymous Session ID & Hold Transfer Pre-wiring', () => {
    it('generates an anonymous session ID starting with anon_session_ and persists it in sessionStorage', () => {
      const sessionId = getOrCreateAnonymousSessionId();
      expect(sessionId).toMatch(/^anon_session_/);

      persistPendingBooking({
        anonymousSessionId: sessionId,
        eventId: 'evt-symphony-2026',
        seatIds: ['A-1'],
        reservedUntil: new Date().toISOString(),
      });

      const retrievedId = getOrCreateAnonymousSessionId();
      expect(retrievedId).toBe(sessionId);

      clearPendingBooking();
      expect(window.sessionStorage.getItem('pending_booking')).toBeNull();
    });

    it('attaches anonymous session ID as userId during reserve() and writes pending_booking', async () => {
      const { result } = renderHook(() => useSeatHold());

      let reserveResult;
      await act(async () => {
        reserveResult = await result.current.reserve('evt-symphony-2026', ['A-1', 'A-2']);
      });

      expect(reserveResult.success).toBe(true);
      expect(result.current.reservationData.userId).toMatch(/^anon_session_/);

      const stored = JSON.parse(window.sessionStorage.getItem('pending_booking'));
      expect(stored).not.toBeNull();
      expect(stored.anonymousSessionId).toBe(result.current.reservationData.userId);
      expect(stored.seatIds).toEqual(['A-1', 'A-2']);
    });

    it('transfers hold ownership from anonymous session ID to authenticated user ID via transferHold()', async () => {
      const anonId = 'anon_session_test_12345';
      const authUserId = 'auth_usr_99999';

      // 1. Reserve seats anonymously
      await mockTicketingService.reserveSeats('evt-symphony-2026', ['A-5', 'A-6'], anonId);

      const currentSeatsBefore = await mockTicketingService.getSeatAvailability('evt-symphony-2026');
      const heldSeatsBefore = currentSeatsBefore.filter((s) => ['A-5', 'A-6'].includes(s.id));
      expect(heldSeatsBefore[0].reservedBy).toBe(anonId);

      // 2. Listener spy
      const listenerSpy = vi.fn();
      const unsubscribe = mockTicketingService.subscribeToSeatChanges('evt-symphony-2026', listenerSpy);

      // 3. Execute transferHold
      const transferResult = await mockTicketingService.transferHold(
        'evt-symphony-2026',
        ['A-5', 'A-6'],
        authUserId,
        anonId
      );

      expect(transferResult.success).toBe(true);
      expect(transferResult.new_owner).toBe(authUserId);

      // 4. Verify seats now belong to authenticated user
      const currentSeatsAfter = await mockTicketingService.getSeatAvailability('evt-symphony-2026');
      const heldSeatsAfter = currentSeatsAfter.filter((s) => ['A-5', 'A-6'].includes(s.id));
      expect(heldSeatsAfter[0].reservedBy).toBe(authUserId);
      expect(heldSeatsAfter[1].reservedBy).toBe(authUserId);

      // 5. Verify realtime listeners were alerted
      expect(listenerSpy).toHaveBeenCalled();

      unsubscribe();
    });
  });

  describe('2. Tab Closure & Sudden Navigation Safe Release (Beacon / beforeunload)', () => {
    it('registers beforeunload handler and calls releaseSeats + sendBeacon when triggered', () => {
      const sendBeaconSpy = vi.fn();
      window.navigator.sendBeacon = sendBeaconSpy;
      const releaseSpy = vi.spyOn(mockTicketingService, 'releaseSeats');

      const { unmount } = renderHook(() =>
        useHoldLifecycle({
          eventId: 'evt-symphony-2026',
          seatIds: ['A-7', 'A-8'],
          userId: 'test_user_hold',
          isActive: true,
        })
      );

      // Dispatch beforeunload event
      window.dispatchEvent(new Event('beforeunload'));

      expect(sendBeaconSpy).toHaveBeenCalledWith(
        '/api/seats/release',
        expect.any(Blob)
      );
      expect(releaseSpy).toHaveBeenCalledWith(
        'evt-symphony-2026',
        ['A-7', 'A-8'],
        'test_user_hold'
      );

      unmount();
      releaseSpy.mockRestore();
    });

    it('does not trigger release on beforeunload if isActive is false', () => {
      const sendBeaconSpy = vi.fn();
      window.navigator.sendBeacon = sendBeaconSpy;
      const releaseSpy = vi.spyOn(mockTicketingService, 'releaseSeats');

      renderHook(() =>
        useHoldLifecycle({
          eventId: 'evt-symphony-2026',
          seatIds: ['A-7'],
          userId: 'test_user_hold',
          isActive: false,
        })
      );

      window.dispatchEvent(new Event('beforeunload'));

      expect(sendBeaconSpy).not.toHaveBeenCalled();
      expect(releaseSpy).not.toHaveBeenCalled();

      releaseSpy.mockRestore();
    });
  });

  describe('3. Hold Timer Continuity & Child Lockdown Render Prop', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('passes isExpired boolean to child render function to enforce input lockdown', () => {
      const reservedUntil = new Date(Date.now() + 3 * 1000).toISOString();
      const onExpire = vi.fn();

      render(
        <HoldTimer reservedUntil={reservedUntil} onExpire={onExpire}>
          {({ isExpired, formattedTime }) => (
            <div>
              <input data-testid="locked-input" disabled={isExpired} />
              <span data-testid="child-time">{formattedTime}</span>
            </div>
          )}
        </HoldTimer>
      );

      const input = screen.getByTestId('locked-input');
      expect(input).not.toBeDisabled();
      expect(screen.getByTestId('child-time')).toHaveTextContent('00:03');

      // Fast-forward past 3 seconds
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(input).toBeDisabled();
      expect(onExpire).toHaveBeenCalled();
    });
  });
});
