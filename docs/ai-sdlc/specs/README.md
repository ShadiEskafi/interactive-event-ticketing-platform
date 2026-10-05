# AI-SDLC Specifications Suite: Interactive Event Ticketing Platform

**Parent Intent Document:** [`intent/interactive-event-ticketing.md`](file:///f:/SHADI/2-Programming/Interactive%20Event%20Ticketing%20Platform/interactive-event-ticketing-platform/intent/interactive-event-ticketing.md)  
**Status:** Approved Specification  
**Architecture Paradigm:** Modular, Test-Driven (Vitest + React Testing Library), Supabase Realtime & RLS Ready  
**Version:** 1.0.0  

---

## 1. Overview & Specification Index

This document suite formalizes the functional, technical, and testing specifications for the Interactive Event Ticketing Platform. The specifications are modularized into dedicated feature domains to eliminate context bloat and ensure testable, independent implementation phases.

| Specification Document | Feature Domain | Key Highlights & Scope |
| :--- | :--- | :--- |
| **[`SPEC-01-interactive-seating-map.md`](file:///f:/SHADI/2-Programming/Interactive%20Event%20Ticketing%20Platform/interactive-event-ticketing-platform/docs/ai-sdlc/specs/SPEC-01-interactive-seating-map.md)** | Interactive SVG Seating Map & Cart | 60fps SVG rendering, Pan/Zoom, `React.memo`, hover tooltips, live cart summary, 5-seat selection limit. |
| **[`SPEC-02-concurrency-and-seat-hold.md`](file:///f:/SHADI/2-Programming/Interactive%20Event%20Ticketing%20Platform/interactive-event-ticketing-platform/docs/ai-sdlc/specs/SPEC-02-concurrency-and-seat-hold.md)** | Concurrency Control & Hold Timer | Atomic PostgreSQL RPC `reserve_seats`, Supabase Realtime synchronization, 300s countdown timer, expiration handshake. |
| **[`SPEC-03-smart-frictionless-auth.md`](file:///f:/SHADI/2-Programming/Interactive%20Event%20Ticketing%20Platform/interactive-event-ticketing-platform/docs/ai-sdlc/specs/SPEC-03-smart-frictionless-auth.md)** | Smart Frictionless Auth | Checkout boundary authentication (Email + OAuth), selection retention, countdown expiration handling during auth modal. |
| **[`SPEC-04-digital-tickets-and-qr.md`](file:///f:/SHADI/2-Programming/Interactive%20Event%20Ticketing%20Platform/interactive-event-ticketing-platform/docs/ai-sdlc/specs/SPEC-04-digital-tickets-and-qr.md)** | Digital Tickets, Signed QR & Export | Idempotent mock checkout, HMAC-SHA256 signed QR code, browser-based PDF/PNG download, "My Tickets" dashboard. |

---

## 2. Master Traceability Matrix

Every functional requirement across all specification files is traced directly to line numbers in [`intent/interactive-event-ticketing.md`](file:///f:/SHADI/2-Programming/Interactive%20Event%20Ticketing%20Platform/interactive-event-ticketing-platform/intent/interactive-event-ticketing.md).

| Requirement ID | Domain Area | Target Specification | Intent Line Reference | Description & Testable Boundary |
| :--- | :--- | :--- | :--- | :--- |
| `REQ-SEAT-01` | Seating Map | `SPEC-01` | [L12](file:///f:/SHADI/2-Programming/Interactive%20Event%20Ticketing%20Platform/interactive-event-ticketing-platform/intent/interactive-event-ticketing.md#L12), [L31](file:///f:/SHADI/2-Programming/Interactive%20Event%20Ticketing%20Platform/interactive-event-ticketing-platform/intent/interactive-event-ticketing.md#L31), [L101-L103](file:///f:/SHADI/2-Programming/Interactive%20Event%20Ticketing%20Platform/interactive-event-ticketing-platform/intent/interactive-event-ticketing.md#L101-L103) | 60fps SVG rendering of 500–1000 seats with multi-touch pan & zoom. |
| `REQ-SEAT-02` | Seating Map | `SPEC-01` | [L32-L34](file:///f:/SHADI/2-Programming/Interactive%20Event%20Ticketing%20Platform/interactive-event-ticketing-platform/intent/interactive-event-ticketing.md#L32-L34) | Seat state color coding (Green, Blue, Orange, Gray) & hover tooltip details. |
| `REQ-SEAT-03` | Seating Map | `SPEC-01` | [L36-L40](file:///f:/SHADI/2-Programming/Interactive%20Event%20Ticketing%20Platform/interactive-event-ticketing-platform/intent/interactive-event-ticketing.md#L36-L40) | Toggle seat selection with a hard ceiling of 5 seats per transaction. |
| `REQ-CART-01` | Cart Summary | `SPEC-01` | [L39](file:///f:/SHADI/2-Programming/Interactive%20Event%20Ticketing%20Platform/interactive-event-ticketing-platform/intent/interactive-event-ticketing.md#L39), [L151](file:///f:/SHADI/2-Programming/Interactive%20Event%20Ticketing%20Platform/interactive-event-ticketing-platform/intent/interactive-event-ticketing.md#L151) | Dynamic cart calculations, itemized seat tiers, subtotal, and CTA enabling. |
| `REQ-HOLD-01` | Concurrency | `SPEC-02` | [L49-L53](file:///f:/SHADI/2-Programming/Interactive%20Event%20Ticketing%20Platform/interactive-event-ticketing-platform/intent/interactive-event-ticketing.md#L49-L53), [L113-L145](file:///f:/SHADI/2-Programming/Interactive%20Event%20Ticketing%20Platform/interactive-event-ticketing-platform/intent/interactive-event-ticketing.md#L113-L145) | Atomic row-level lock (`FOR UPDATE`) via PostgreSQL RPC on checkout initiation. |
| `REQ-HOLD-02` | Realtime Sync | `SPEC-02` | [L53](file:///f:/SHADI/2-Programming/Interactive%20Event%20Ticketing%20Platform/interactive-event-ticketing-platform/intent/interactive-event-ticketing.md#L53), [L111](file:///f:/SHADI/2-Programming/Interactive%20Event%20Ticketing%20Platform/interactive-event-ticketing-platform/intent/interactive-event-ticketing.md#L111) | Supabase Realtime websocket propagation of seat status to all active viewers. |
| `REQ-HOLD-03` | Timer Lifecycle | `SPEC-02` | [L54](file:///f:/SHADI/2-Programming/Interactive%20Event%20Ticketing%20Platform/interactive-event-ticketing-platform/intent/interactive-event-ticketing.md#L54), [L118](file:///f:/SHADI/2-Programming/Interactive%20Event%20Ticketing%20Platform/interactive-event-ticketing-platform/intent/interactive-event-ticketing.md#L118) | 300-second countdown hold timer with precision heartbeat synchronization. |
| `REQ-HOLD-04` | Hold Expiry | `SPEC-02` | [L56-L63](file:///f:/SHADI/2-Programming/Interactive%20Event%20Ticketing%20Platform/interactive-event-ticketing-platform/intent/interactive-event-ticketing.md#L56-L63), [L146](file:///f:/SHADI/2-Programming/Interactive%20Event%20Ticketing%20Platform/interactive-event-ticketing-platform/intent/interactive-event-ticketing.md#L146) | Invalidation of checkout at 00:00, seat release to Green, modal alert, redirect. |
| `REQ-AUTH-01` | Authentication | `SPEC-03` | [L71-L74](file:///f:/SHADI/2-Programming/Interactive%20Event%20Ticketing%20Platform/interactive-event-ticketing-platform/intent/interactive-event-ticketing.md#L71-L74) | Frictionless browsing; defer auth prompt to checkout boundary. |
| `REQ-AUTH-02` | Auth Retention | `SPEC-03` | [L75-L77](file:///f:/SHADI/2-Programming/Interactive%20Event%20Ticketing%20Platform/interactive-event-ticketing-platform/intent/interactive-event-ticketing.md#L75-L77) | Session and seat preservation during auth; zero cart loss post-login. |
| `REQ-AUTH-03` | Auth Timeout | `SPEC-03` | [L56-L63](file:///f:/SHADI/2-Programming/Interactive%20Event%20Ticketing%20Platform/interactive-event-ticketing-platform/intent/interactive-event-ticketing.md#L56-L63), [L71-L77](file:///f:/SHADI/2-Programming/Interactive%20Event%20Ticketing%20Platform/interactive-event-ticketing-platform/intent/interactive-event-ticketing.md#L71-L77) | Handling timer expiration while auth modal is active; immediate seat release. |
| `REQ-TICK-01` | Mock Checkout | `SPEC-04` | [L85-L88](file:///f:/SHADI/2-Programming/Interactive%20Event%20Ticketing%20Platform/interactive-event-ticketing-platform/intent/interactive-event-ticketing.md#L85-L88), [L152](file:///f:/SHADI/2-Programming/Interactive%20Event%20Ticketing%20Platform/interactive-event-ticketing-platform/intent/interactive-event-ticketing.md#L152) | Form validation, mock payment confirmation, and permanent `sold` transition. |
| `REQ-TICK-02` | Signed QR Code | `SPEC-04` | [L89](file:///f:/SHADI/2-Programming/Interactive%20Event%20Ticketing%20Platform/interactive-event-ticketing-platform/intent/interactive-event-ticketing.md#L89), [L105](file:///f:/SHADI/2-Programming/Interactive%20Event%20Ticketing%20Platform/interactive-event-ticketing-platform/intent/interactive-event-ticketing.md#L105) | HMAC-SHA256 signature payload generation with gate-validation schema. |
| `REQ-TICK-03` | Document Export | `SPEC-04` | [L90](file:///f:/SHADI/2-Programming/Interactive%20Event%20Ticketing%20Platform/interactive-event-ticketing-platform/intent/interactive-event-ticketing.md#L90), [L106-L107](file:///f:/SHADI/2-Programming/Interactive%20Event%20Ticketing%20Platform/interactive-event-ticketing-platform/intent/interactive-event-ticketing.md#L106-L107) | Client-side export to printable PDF and high-res PNG without backend calls. |
| `REQ-TICK-04` | "My Tickets" | `SPEC-04` | [L17](file:///f:/SHADI/2-Programming/Interactive%20Event%20Ticketing%20Platform/interactive-event-ticketing-platform/intent/interactive-event-ticketing.md#L17), [L91](file:///f:/SHADI/2-Programming/Interactive%20Event%20Ticketing%20Platform/interactive-event-ticketing-platform/intent/interactive-event-ticketing.md#L91) | Persistent storage and retrieval of issued tickets with QR display modal. |

---

## 3. Abstract Domain Service Contract (`ITicketingService`)

To achieve deterministic testability across Vitest suites without requiring a live Supabase backend during unit/integration tests, all features interact with a unified service contract.

```typescript
/**
 * Core Ticketing Domain Service Contract
 */
export interface ITicketingService {
  /**
   * Retrieves full details for a given event, including venue reference.
   */
  getEventDetails(eventId: string): Promise<EventRecord>;

  /**
   * Retrieves venue seating layout geometry and configuration.
   */
  getVenueLayout(venueId: string): Promise<VenueLayout>;

  /**
   * Fetches real-time availability states for all seats in an event.
   */
  getSeatAvailability(eventId: string): Promise<SeatRecord[]>;

  /**
   * Executes atomic temporary hold on selected seats.
   * Enforces FOR UPDATE lock and duration.
   */
  reserveSeats(
    eventId: string,
    seatIds: string[],
    userId: string,
    holdDurationSeconds?: number
  ): Promise<ReservationResult>;

  /**
   * Manually or automatically releases held seats back to 'available'.
   */
  releaseSeats(
    eventId: string,
    seatIds: string[],
    userId: string
  ): Promise<{ releasedSeatIds: string[] }>;

  /**
   * Finalizes booking, creates ticket records, and marks seats permanently 'sold'.
   */
  confirmBooking(
    bookingId: string,
    paymentDetails: MockPaymentPayload
  ): Promise<BookingConfirmationResult>;

  /**
   * Fetches all confirmed tickets belonging to a specific user.
   */
  getUserTickets(userId: string): Promise<TicketRecord[]>;

  /**
   * Subscribes to real-time seat changes via WebSocket/Mock emitter.
   * Returns unsubscribe cleanup function.
   */
  subscribeToSeatChanges(
    eventId: string,
    onSeatUpdate: (updatedSeat: SeatRecord) => void
  ): () => void;
}
```

---

## 4. Supabase Database Schema Blueprint

```sql
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Venues Table
CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  address_coordinates JSONB NOT NULL DEFAULT '{"lat": 0, "lng": 0}'::JSONB,
  layout_config JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Events Table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  date_time TIMESTAMPTZ NOT NULL,
  banner_url TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Seats Table
CREATE TABLE seats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  section TEXT NOT NULL,
  row_label TEXT NOT NULL,
  seat_number INT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('VIP', 'Regular', 'Balcony')),
  price NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold', 'unavailable')),
  reserved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reserved_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_event_seat UNIQUE (event_id, section, row_label, seat_number)
);

-- 4. Bookings Table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  total_amount NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Tickets Table
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  seat_id UUID NOT NULL REFERENCES seats(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticket_code TEXT NOT NULL UNIQUE,
  qr_signature TEXT NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT FALSE,
  scanned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for high-throughput concurrency and real-time filtering
CREATE INDEX idx_seats_event_status ON seats(event_id, status);
CREATE INDEX idx_seats_reserved_until ON seats(reserved_until) WHERE status = 'reserved';
CREATE INDEX idx_tickets_user_id ON tickets(user_id);
CREATE INDEX idx_tickets_ticket_code ON tickets(ticket_code);
```

---

## 5. Architectural RBAC & Row-Level Security (RLS) Blueprint

In alignment with [`intent/interactive-event-ticketing.md#L16-L20`](file:///f:/SHADI/2-Programming/Interactive%20Event%20Ticketing%20Platform/interactive-event-ticketing-platform/intent/interactive-event-ticketing.md#L16-L20), the platform models three distinct roles:
1. **Attendee:** End user booking tickets and viewing their own purchases.
2. **Organizer / Admin:** Manages venue configurations, events, and monitors booking policies.
3. **Gate Staff / Validator:** Validates tickets at venue gates via QR code scans.

### Row-Level Security (RLS) Policies

```sql
-- Enable RLS on all domain tables
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- 1. Venues & Events: Public read access
CREATE POLICY "Public can view published events and venues"
  ON events FOR SELECT
  USING (status = 'published');

CREATE POLICY "Public can view venues"
  ON venues FOR SELECT
  USING (true);

-- 2. Seats: Public read access; mutations only permitted through Security Definer RPC
CREATE POLICY "Public can view all seat states"
  ON seats FOR SELECT
  USING (true);

-- 3. Bookings: Users manage their own bookings; Admins view all
CREATE POLICY "Users can view their own bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookings"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 4. Tickets: Attendees view own tickets; Gate Staff can validate
CREATE POLICY "Attendees can view their own tickets"
  ON tickets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Gate Staff can view and validate any ticket"
  ON tickets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
        AND (auth.users.raw_user_meta_data->>'role') IN ('gate_staff', 'admin')
    )
  );

CREATE POLICY "Gate Staff can update ticket usage status"
  ON tickets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
        AND (auth.users.raw_user_meta_data->>'role') IN ('gate_staff', 'admin')
    )
  )
  WITH CHECK (
    is_used = TRUE AND scanned_at IS NOT NULL
  );
```
