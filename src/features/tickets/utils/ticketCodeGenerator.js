/**
 * Ticket & Booking Reference Code Generator (SPEC-04)
 */

/**
 * Generates an alphanumeric, human-readable ticket code e.g. TKT-10029 or TKT-A8F3B
 * @param {number} length
 * @returns {string} Formatted ticket code
 */
export function generateTicketCode(length = 5) {
  const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `TKT-${result}`;
}

/**
 * Generates a human-readable booking reference e.g. BK-847291
 * @param {number} length
 * @returns {string} Formatted booking reference
 */
export function generateBookingId(length = 6) {
  const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `BK-${result}`;
}
