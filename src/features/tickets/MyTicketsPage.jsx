import { useState } from 'react';
import { useAuth } from '../auth/hooks/useAuth';
import { useUserTickets } from './hooks/useUserTickets';
import { EventTicketGroup } from './components/EventTicketGroup';
import { FullScreenQRModal } from './components/FullScreenQRModal';
import { useLanguage } from '../../context';
import './Tickets.css';

/**
 * "My Tickets" Attendee Dashboard Container (SPEC-04 / REQ-TICK-04.5)
 */
export function MyTicketsPage({
  userId = null,
  onExploreEvents,
}) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const storedAnonId =
    typeof window !== 'undefined'
      ? window.localStorage?.getItem('ticketcraft_anon_session_id') ||
        window.sessionStorage?.getItem('ticketcraft_anon_session_id')
      : null;
  const effectiveUserId = userId || user?.id || storedAnonId;
  const { groupedTickets, isLoading, error } = useUserTickets(effectiveUserId);

  const [activeTab, setActiveTab] = useState('upcoming');
  const [selectedTicket, setSelectedTicket] = useState(null);

  const handleOpenQr = (ticket) => {
    setSelectedTicket(ticket);
  };

  const handleCloseQr = () => {
    setSelectedTicket(null);
  };

  return (
    <div className="my-tickets-container" data-testid="my-tickets-page">
      <header className="my-tickets-header">
        <h1 className="my-tickets-title">{t('tickets.title', 'My Tickets')}</h1>
        <p className="my-tickets-subtitle">
          {t('tickets.subtitle', 'Manage your confirmed event bookings and access high-contrast QR entry passes.')}
        </p>
      </header>

      {/* Tabs */}
      <div className="my-tickets-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'upcoming'}
          className={`my-tickets-tab ${activeTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => setActiveTab('upcoming')}
        >
          {t('tickets.tab_upcoming', 'Upcoming Events')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'past'}
          className={`my-tickets-tab ${activeTab === 'past' ? 'active' : ''}`}
          onClick={() => setActiveTab('past')}
        >
          {t('tickets.tab_past', 'Past Events')}
        </button>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="loading-state" style={{ color: '#94A3B8', padding: '3rem', textAlign: 'center' }}>
          {t('tickets.loading', 'Loading your confirmed tickets...')}
        </div>
      ) : error ? (
        <div className="auth-error-banner" role="alert">
          {error}
        </div>
      ) : groupedTickets.length === 0 || activeTab === 'past' ? (
        <div className="empty-state" data-testid="empty-tickets-state">
          <h3>{t('tickets.no_tickets_title', 'No Tickets Found')}</h3>
          <p>
            {activeTab === 'past'
              ? t('tickets.no_past_desc', 'You have no past event tickets.')
              : t('tickets.no_tickets_desc', 'You have no active event passes yet. Browse available seats and book your first concert experience.')}
          </p>
          {onExploreEvents && activeTab === 'upcoming' && (
            <button
              type="button"
              className="btn-receipt-dashboard"
              data-testid="btn-explore-events"
              style={{ marginTop: '1.25rem' }}
              onClick={onExploreEvents}
            >
              {t('tickets.explore_events', 'Explore Events')}
            </button>
          )}
        </div>
      ) : (
        <div className="my-tickets-content" data-testid="tickets-list">
          {groupedTickets.map((group) => (
            <EventTicketGroup
              key={group.eventId || group.eventTitle}
              eventTitle={group.eventTitle}
              eventDate={group.eventDate}
              venueName={group.venueName}
              tickets={group.tickets}
              onShowQr={handleOpenQr}
            />
          ))}
        </div>
      )}

      {/* Full-Screen QR Modal with Brightness Boost */}
      <FullScreenQRModal
        isOpen={Boolean(selectedTicket)}
        ticket={selectedTicket}
        onClose={handleCloseQr}
      />
    </div>
  );
}
