export const mockVenueLayout = {
  venueId: '00000000-0000-0000-0000-000000000001',
  name: 'Grand Symphony Hall',
  viewBox: '0 0 1400 950',
  stage: {
    label: 'STAGE / PERFORMANCE AREA',
    x: 350,
    y: 40,
    width: 700,
    height: 70,
  },
  sections: [
    {
      id: 'sec-vip',
      name: 'Orchestra VIP',
      category: 'VIP',
      defaultPrice: 150.0,
      colorTheme: '#10B981',
      rows: [
        { rowLabel: 'A', seats: 24, startX: 220, startY: 160, spacing: 40 },
        { rowLabel: 'B', seats: 24, startX: 220, startY: 200, spacing: 40 },
        { rowLabel: 'C', seats: 24, startX: 220, startY: 240, spacing: 40 },
        { rowLabel: 'D', seats: 24, startX: 220, startY: 280, spacing: 40 },
        { rowLabel: 'E', seats: 24, startX: 220, startY: 320, spacing: 40 },
      ],
    },
    {
      id: 'sec-reg',
      name: 'Mezzanine Regular',
      category: 'Regular',
      defaultPrice: 85.0,
      colorTheme: '#3B82F6',
      rows: [
        { rowLabel: 'F', seats: 30, startX: 100, startY: 400, spacing: 40 },
        { rowLabel: 'G', seats: 30, startX: 100, startY: 440, spacing: 40 },
        { rowLabel: 'H', seats: 30, startX: 100, startY: 480, spacing: 40 },
        { rowLabel: 'I', seats: 30, startX: 100, startY: 520, spacing: 40 },
        { rowLabel: 'J', seats: 30, startX: 100, startY: 560, spacing: 40 },
        { rowLabel: 'K', seats: 30, startX: 100, startY: 600, spacing: 40 },
        { rowLabel: 'L', seats: 30, startX: 100, startY: 640, spacing: 40 },
        { rowLabel: 'M', seats: 30, startX: 100, startY: 680, spacing: 40 },
      ],
    },
    {
      id: 'sec-balc',
      name: 'Upper Balcony',
      category: 'Balcony',
      defaultPrice: 45.0,
      colorTheme: '#8B5CF6',
      rows: [
        { rowLabel: 'N', seats: 32, startX: 60, startY: 760, spacing: 40 },
        { rowLabel: 'O', seats: 32, startX: 60, startY: 800, spacing: 40 },
        { rowLabel: 'P', seats: 32, startX: 60, startY: 840, spacing: 40 },
        { rowLabel: 'Q', seats: 32, startX: 60, startY: 880, spacing: 40 },
        { rowLabel: 'R', seats: 32, startX: 60, startY: 920, spacing: 40 },
      ],
    },
  ],
};

/**
 * Generates initial seat list (520 total) from layout configuration.
 * Seeds deterministic reserved and sold seats for visual testing.
 */
export function generateSeats(layout = mockVenueLayout) {
  const seats = [];

  layout.sections.forEach((section) => {
    section.rows.forEach((row) => {
      for (let i = 1; i <= row.seats; i++) {
        const seatId = `${row.rowLabel}-${i}`;
        let status = 'available';

        // Deterministic seeded statuses according to SPEC-01
        if (seatId === 'B-1' || seatId === 'B-2') {
          status = 'reserved';
        } else if (seatId === 'C-1' || seatId === 'C-2') {
          status = 'sold';
        }

        seats.push({
          id: seatId,
          rowLabel: row.rowLabel,
          seatNumber: i,
          sectionId: section.id,
          sectionName: section.name,
          category: section.category,
          price: section.defaultPrice,
          status,
          cx: row.startX + (i - 1) * row.spacing,
          cy: row.startY,
          radius: 12,
        });
      }
    });
  });

  return seats;
}
