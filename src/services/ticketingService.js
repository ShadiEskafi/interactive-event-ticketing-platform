import { supabaseTicketingService } from './supabaseTicketingService';
import { mockTicketingService } from '../features/seatmap/services/mockTicketingService';

const isProductionSupabase = Boolean(
  typeof window !== 'undefined' &&
  import.meta.env.VITE_SUPABASE_ANON_KEY &&
  !import.meta.env.VITEST
);

/**
 * Unified Ticketing Service
 * Automatically routes to live Supabase backend when environment variables are present,
 * or mockTicketingService during automated test runs.
 */
export const ticketingService = isProductionSupabase
  ? supabaseTicketingService
  : mockTicketingService;

export { supabaseTicketingService, mockTicketingService };
