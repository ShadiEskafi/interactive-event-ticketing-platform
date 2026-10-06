import { TicketCard } from './TicketCard';

/**
 * Event Ticket Group Component (SPEC-04 / REQ-TICK-04.5)
 * Organizes tickets grouped by event and performance date.
 */
export function EventTicketGroup({
  eventTitle = 'Grand Symphony Concert',
  eventDate = 'Saturday, Nov 14, 2026 • 8:00 PM',
  venueName = 'Grand Symphony Hall, Auditorium',
  tickets = [],
  onShowQr,
}) {
  if (!tickets || tickets.length === 0) return null;

  return (
    <div className="event-ticket-group" data-testid="event-ticket-group">
      <header className="event-group-header">
        <div className="event-group-title-row">
          <h3 className="event-group-title">{eventTitle}</h3>
          <span className="event-group-count">
            {tickets.length} {tickets.length === 1 ? 'Ticket' : 'Tickets'}
          </span>
        </div>
        <p className="event-group-meta">
          <span>{eventDate}</span> &bull; <span>{venueName}</span>
        </p>
      </header>

      <div className="event-group-grid">
        {tickets.map((ticket) => (
          <TicketCard
            key={ticket.id || ticket.ticket_code}
            ticket={ticket}
            onShowQr={onShowQr}
          />
        ))}
      </div>
    </div>
  );
}
