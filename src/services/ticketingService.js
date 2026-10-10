import { supabaseTicketingService } from './supabaseTicketingService';
import { mockTicketingService } from '../features/seatmap/services/mockTicketingService';

const isProductionSupabase = Boolean(
  typeof window !== 'undefined' &&
  import.meta.env.VITE_SUPABASE_ANON_KEY &&
  import.meta.env.VITE_USE_MOCK !== 'true' &&
  !import.meta.env.VITEST
);

if (typeof window !== 'undefined' && !import.meta.env.VITEST) {
  console.log(
    `[TicketingServiceRouter] Active router mode: ${
      isProductionSupabase ? 'Production Supabase PostgreSQL' : 'Local / Mock Ticketing Service'
    }`
  );
}

/**
 * Unified Ticketing Service
 * Automatically routes to live Supabase backend when environment variables are present,
 * or mockTicketingService during automated test runs or when VITE_USE_MOCK is set.
 */
export const ticketingService = isProductionSupabase
  ? supabaseTicketingService
  : mockTicketingService;

export { supabaseTicketingService, mockTicketingService };
