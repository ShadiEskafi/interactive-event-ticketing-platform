# Intent: Interactive Event Ticketing Platform

**Status:** draft  
**Author:** Product Architect & Senior BA Session  
**Scope:** MVP Implementation & Architecture Blueprint  

---

## 1. Executive Summary & Problem Statement
Traditional ticketing systems rely on static tables and abstract seat numbers, leaving attendees without visual context regarding distance from the stage, viewing angles, or seat categories. Furthermore, concurrent booking collisions (double bookings) and stale locked seats create frustration.

This platform provides a visual-first, real-time interactive venue seating experience (SVG) running at 60fps, atomic concurrency protection with a 5-minute fair hold countdown timer, smart frictionless authentication, and instant digital ticket issuance with digitally signed QR codes downloadable directly as PDF/PNG without email dependencies.

---

## 2. User Roles
- **Attendee (Primary MVP Role):** Browses events, interacts with visual SVG seating map, locks seats under a 5-minute timer, completes mock checkout, and receives downloadable signed QR tickets stored in "My Tickets".
- **Event Organizer / Admin (Architectural Support):** Configures venue seating via flexible JSON layouts, defines tier pricing, and monitors booking policies.
- **Gate Staff / Ticket Validator (Future Native/PWA):** Scans and validates signed QR codes at venue gates, marking them as used idempotently.

---

## 3. User Stories & Acceptance Criteria (Gherkin Syntax)

### Feature 1: Interactive SVG Seating Map
**User Story:** As an attendee, I want to visually inspect a venue's seat map with real-time availability and tier pricing so that I can choose the best seats according to my budget and viewing preference.

```gherkin
Scenario: Attendee views available seats and hover details
  Given the attendee is on the event seat selection page
  When the SVG venue map renders
  Then each seat displays its status color (Green: Available, Orange: Reserved/Held, Gray: Sold, Blue: Selected)
  And hovering over an available seat displays a tooltip with Row, Seat Number, Category (VIP/Regular/Balcony), and Price

Scenario: Attendee selects seats within policy limits
  Given the attendee has selected 0 seats
  When the attendee clicks on an available seat
  Then the seat color changes to Selected (Blue)
  And the cart summary updates with the seat count and subtotal
  And selecting more than 5 seats is prevented with an inline notification
```

---

### Feature 2: Concurrency & 5-Minute Hold Timer
**User Story:** As an attendee, I want my selected seats to be exclusively reserved for me while I enter payment details so that no other user can book them simultaneously.

```gherkin
Scenario: Atomic temporary lock acquisition
  Given the attendee has selected 2 available seats
  When the attendee clicks "Proceed to Checkout"
  Then an atomic database transaction locks both seats
  And the seat status updates to Reserved (Orange) for all concurrent users via Realtime
  And a 5-minute countdown timer starts on the checkout view

Scenario: Countdown timer reaches expiration (00:00)
  Given the attendee is on the checkout screen with 2 reserved seats
  When the countdown timer reaches 00:00 without confirmed payment
  Then the system invalidates the checkout session
  And the seats are released and updated to Available (Green) immediately
  And a "Session Expired Modal" is displayed disabling payment inputs
  And the attendee is redirected back to the venue map upon clicking the modal CTA
```

---

### Feature 3: Smart Frictionless Authentication
**User Story:** As a visitor, I want to explore events and choose my seats freely before being prompted to sign in so that my booking journey is frictionless.

```gherkin
Scenario: Authenticating at the checkout boundary
  Given an unauthenticated visitor has selected seats and clicked "Proceed to Checkout"
  When the checkout modal opens
  Then the visitor is prompted with a quick Sign In / Sign Up form (Email + OAuth)
  And upon successful authentication, the reserved seats are linked to the user account
  And the user is immediately taken to the payment step without losing their selection
```

---

### Feature 4: Instant Digital Ticket Issuance & Signed QR
**User Story:** As a confirmed ticket holder, I want an immediate digital ticket with a tamper-proof QR code that I can save to my device and access anytime from my account.

```gherkin
Scenario: Generating and downloading ticket after successful checkout
  Given the attendee completes the checkout form and confirms payment
  When the booking transaction succeeds
  Then the seat status permanently updates to Sold
  And a digital ticket is generated with a signed HMAC/JWT QR code payload
  And the attendee can download the ticket as a PDF or high-resolution PNG
  And the ticket is permanently saved in the attendee's "My Tickets" dashboard
```

---

## 4. Technical Architecture Recommendation

### 4.1 Frontend Stack & Design
- **Core:** React 19, Vite 8, Tailwind CSS, shadcn/ui (Radix UI).
- **SVG Map Performance:**
  - Individual seat components memoized with `React.memo`.
  - Tooltips managed via event delegation or mouse tracking to prevent SVG re-renders.
  - Multi-touch gestures (Pan & Pinch-to-Zoom) for responsive mobile viewing.
- **Client-Side Generation:**
  - QR Code: `qrcode.react` (SVG/Canvas rendering).
  - PDF Export: `@react-pdf/renderer` or `jspdf + html2canvas`.
  - PNG Export: `html-to-image`.

### 4.2 Backend & Data Storage (Supabase)
- **Database Engine:** PostgreSQL with Row-Level Security (RLS).
- **Real-Time Layer:** Supabase Realtime tracking `postgres_changes` on the `seats` table for live UI synchronization.
- **Atomic Concurrency (Postgres RPC):**
  ```sql
  CREATE OR REPLACE FUNCTION reserve_seats(
    p_event_id UUID,
    p_seat_ids UUID[],
    p_user_id UUID,
    p_hold_duration_seconds INT DEFAULT 300
  ) RETURNS JSONB
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $$
  BEGIN
    -- Atomic row lock with FOR UPDATE to prevent race conditions
    PERFORM id FROM seats
    WHERE id = ANY(p_seat_ids)
      AND event_id = p_event_id
      AND status = 'available'
    FOR UPDATE;

    IF (SELECT COUNT(*) FROM seats WHERE id = ANY(p_seat_ids) AND status = 'available') <> array_length(p_seat_ids, 1) THEN
      RAISE EXCEPTION 'One or more seats are no longer available.';
    END IF;

    -- Update seats to reserved and record lock expiration
    UPDATE seats
    SET status = 'reserved',
        reserved_by = p_user_id,
        reserved_until = NOW() + (p_hold_duration_seconds || ' seconds')::INTERVAL
    WHERE id = ANY(p_seat_ids);

    RETURN jsonb_build_object('success', true);
  END;
  $$;
  ```
- **Hold Expiration Cleanup:** Supabase Edge Function or `pg_cron` schedule checking `WHERE status = 'reserved' AND reserved_until < NOW()` to auto-release seats to `available`.

### 4.3 Database Schema Blueprint
- `events`: id, title, description, category, venue_id, date_time, banner_url, status.
- `venues`: id, name, city, address_coordinates, layout_config (JSONB).
- `seats`: id, venue_id, event_id, section, row_label, seat_number, category (VIP/Regular/Balcony), price, status (available/reserved/sold), reserved_by, reserved_until.
- `bookings`: id, user_id, event_id, total_amount, status (pending/confirmed/cancelled), created_at.
- `tickets`: id, booking_id, seat_id, user_id, ticket_code, qr_signature, is_used, scanned_at.

---

## 5. Scope & Roadmap
- **MVP (Current Scope):**
  1. Landing Page with interactive hero preview and featured events.
  2. Responsive SVG seat map (500–1000 seats) with pan/zoom and hover tooltips.
  3. Real-time seat state machine with 5-minute atomic lock.
  4. Smart Auth (Email & OAuth) + "My Tickets" dashboard.
  5. Interactive Mock Checkout.
  6. Instant client-side QR generation & PDF/PNG export.
- **Post-MVP Phases:**
  1. Live payment integration (Stripe, Apple Pay, Moyasar/Tap).
  2. Organizer Admin Venue Layout Builder (Drag & Drop UI).
  3. Native/PWA Gate Scanner application with camera barcode scanning.
  4. Email notifications via Resend.

---

## 6. Open Questions
1. What exact initial demo venue layout should be created for seed data (e.g., Opera House layout with Orchestra, Mezzanine, and Balcony, or standard Cinema layout)?
2. Should we support promotional discount / coupon codes in the Mock Checkout flow?
