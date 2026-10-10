import { MyTicketsPage } from './MyTicketsPage';

/**
 * TicketDashboard alias for MyTicketsPage (SPEC-04 / REQ-TICK-04.5)
 */
export function TicketDashboard(props) {
  return <MyTicketsPage {...props} />;
}

export { MyTicketsPage };
