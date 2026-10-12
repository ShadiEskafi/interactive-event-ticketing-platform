import { supabaseTicketingService } from './supabaseTicketingService';
import {
  mockTicketingService,
  EVENT_SEATS_STORAGE_KEY_PREFIX,
  seedEventSeats,
} from '../features/seatmap/services/mockTicketingService';

const isProductionSupabase = Boolean(
  typeof window !== 'undefined' &&
  import.meta.env.VITE_SUPABASE_ANON_KEY &&
  import.meta.env.VITE_USE_MOCK !== 'true' &&
  !import.meta.env.VITEST
);

if (typeof window !== 'undefined' && !import.meta.env.VITEST) {
  console.log(
    `[TicketingServiceRouter] Active router mode: ${
      isProductionSupabase ? 'Production Supabase PostgreSQL' : 'In-Memory Test Service'
    }`
  );
}

/**
 * Unified Ticketing Service Router
 * In production/browser, calls route directly to live Supabase PostgreSQL & Realtime.
 * In Vitest sandbox runs, routes to in-memory test implementation for deterministic execution without external network.
 */
export const ticketingService = isProductionSupabase
  ? supabaseTicketingService
  : mockTicketingService;

export { supabaseTicketingService, mockTicketingService, EVENT_SEATS_STORAGE_KEY_PREFIX, seedEventSeats };

