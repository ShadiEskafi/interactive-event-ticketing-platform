/**
 * Currency and seat label formatting utilities
 */

export function formatCurrency(amount) {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '$0.00';
  }
  return `$${amount.toFixed(2)}`;
}

export function formatSeatLabel(row, number) {
  return `${row}-${number}`;
}
