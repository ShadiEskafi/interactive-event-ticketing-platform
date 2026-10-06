import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TicketPassView } from '../../src/features/tickets/components/TicketPassView';
import { ticketExportService } from '../../src/features/tickets/services/ticketExportService';
import * as htmlToImage from 'html-to-image';

describe('Client-Side Ticket Export Pipeline (SPEC-04 / Scenario 4.3)', () => {
  const mockTicket = {
    id: 'tkt_test_10029',
    booking_id: 'BK-847291',
    event_id: 'evt-symphony-2026',
    seat_id: 'A-12',
    seat_number: 12,
    row_label: 'A',
    tier: 'VIP',
    category: 'VIP',
    price: 150,
    attendee_name: 'Jane Doe',
    ticket_code: 'TKT-10029',
    qr_signature: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
    qr_payload: JSON.stringify({
      tid: 'tkt_test_10029',
      bid: 'BK-847291',
      eid: 'evt-symphony-2026',
      sid: 'A-12',
      tier: 'VIP',
      iat: 1790998800,
      sig: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
    }),
    event_title: 'Grand Symphony Concert',
    event_date: 'Saturday, Nov 14, 2026 • 8:00 PM',
    venue_name: 'Grand Symphony Hall, Auditorium',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders pass card with QR code, attendee details, and export action buttons', () => {
    render(<TicketPassView ticket={mockTicket} />);

    expect(screen.getByTestId('ticket-pass-TKT-10029')).toBeInTheDocument();
    expect(screen.getByText('TKT-10029')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByTestId('qr-code-svg')).toBeInTheDocument();
    expect(screen.getByTestId('download-pdf-btn')).toBeInTheDocument();
    expect(screen.getByTestId('download-png-btn')).toBeInTheDocument();
  });

  it('invokes exportTicketAsPdf and saves A5 PDF as Ticket-TKT-10029.pdf upon clicking Download PDF', async () => {
    const exportPdfSpy = vi.spyOn(ticketExportService, 'exportTicketAsPdf').mockResolvedValue({});

    render(<TicketPassView ticket={mockTicket} />);

    const downloadPdfBtn = screen.getByTestId('download-pdf-btn');
    fireEvent.click(downloadPdfBtn);

    await waitFor(() => {
      expect(exportPdfSpy).toHaveBeenCalledWith(
        mockTicket,
        expect.any(HTMLElement)
      );
    });

    exportPdfSpy.mockRestore();
  });

  it('invokes exportTicketAsPng with 2x retina pixelRatio upon clicking Download PNG', async () => {
    const exportPngSpy = vi.spyOn(ticketExportService, 'exportTicketAsPng').mockResolvedValue('data:image/png;base64,mock');

    render(<TicketPassView ticket={mockTicket} />);

    const downloadPngBtn = screen.getByTestId('download-png-btn');
    fireEvent.click(downloadPngBtn);

    await waitFor(() => {
      expect(exportPngSpy).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        'TKT-10029'
      );
    });

    exportPngSpy.mockRestore();
  });

  it('ticketExportService executes jsPDF document generation successfully', async () => {
    // In jsdom, jsPDF instance provides internal output and page structure
    const doc = await ticketExportService.exportTicketAsPdf(mockTicket);
    expect(doc).toBeDefined();
    expect(doc.internal.pageSize.getWidth()).toBeCloseTo(148, 0); // A5 width
    expect(doc.internal.pageSize.getHeight()).toBeCloseTo(210, 0); // A5 height
  });

  it('ticketExportService calls html-to-image with pixelRatio 2', async () => {
    const toPngSpy = vi.spyOn(htmlToImage, 'toPng').mockResolvedValue('data:image/png;base64,mock');
    const fakeElement = document.createElement('div');

    // Prevent actual click in jsdom
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    await ticketExportService.exportTicketAsPng(fakeElement, 'TKT-10029');

    expect(toPngSpy).toHaveBeenCalledWith(
      fakeElement,
      expect.objectContaining({ pixelRatio: 2, quality: 0.95 })
    );

    toPngSpy.mockRestore();
    clickSpy.mockRestore();
  });
});
