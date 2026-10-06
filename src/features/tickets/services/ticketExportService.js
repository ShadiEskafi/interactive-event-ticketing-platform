import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

/**
 * Client-Side Ticket Export Service (SPEC-04 / REQ-TICK-04.4)
 * Generates print-ready PDFs and Retina 2x PNG passes directly in the browser.
 */
class TicketExportService {
  /**
   * Generates a 2x Retina PNG raster image of the ticket pass card DOM node
   * and triggers an immediate browser file download.
   *
   * @param {HTMLElement} passElement - DOM element container of the ticket pass
   * @param {string} ticketCode - Unique ticket code for file naming (e.g. TKT-10029)
   * @returns {Promise<string>} Generated PNG Data URL
   */
  async exportTicketAsPng(passElement, ticketCode = 'PASS') {
    if (!passElement) {
      throw new Error('Target pass DOM element not provided for PNG export.');
    }

    try {
      const dataUrl = await toPng(passElement, {
        pixelRatio: 2,
        quality: 0.95,
        cacheBust: true,
      });

      const filename = `Ticket-${ticketCode}.png`;
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return dataUrl;
    } catch (err) {
      console.error('Failed to export ticket as PNG:', err);
      throw err;
    }
  }

  /**
   * Generates a high-fidelity A5 PDF document from ticket pass data / element
   * and triggers an immediate browser file download.
   *
   * @param {Object} ticket - Ticket data record
   * @param {HTMLElement} [passElement] - Optional DOM element to rasterize and embed
   * @returns {Promise<jsPDF>}
   */
  async exportTicketAsPdf(ticket, passElement = null) {
    if (!ticket) {
      throw new Error('Ticket record is required for PDF export.');
    }

    const ticketCode = ticket.ticket_code || 'TKT-00000';
    const filename = `Ticket-${ticketCode}.pdf`;

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a5',
      });

      if (passElement) {
        // High fidelity raster capture embedded cleanly into A5 page
        const imgDataUrl = await toPng(passElement, {
          pixelRatio: 2,
          quality: 0.95,
        });

        // A5 dimensions: 148mm x 210mm
        const pageWidth = 148;
        const pageHeight = 210;
        const margin = 10;
        const targetWidth = pageWidth - margin * 2;
        const targetHeight = (targetWidth * 1.4); // Proportional aspect ratio

        doc.setFillColor(15, 23, 42); // #0F172A
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
        doc.addImage(imgDataUrl, 'PNG', margin, margin, targetWidth, Math.min(targetHeight, pageHeight - margin * 2));
      } else {
        // Fallback text & vector PDF rendering
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, 148, 210, 'F');

        doc.setTextColor(248, 250, 252);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(ticket.event_title || 'Grand Symphony Concert', 14, 25);

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text(ticket.event_date || 'Saturday, Nov 14, 2026 • 8:00 PM', 14, 34);
        doc.text(ticket.venue_name || 'Grand Symphony Hall, Auditorium', 14, 42);

        // Divider
        doc.setDrawColor(51, 65, 85);
        doc.line(14, 48, 134, 48);

        // Seat info
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.text(`Seat: Row ${ticket.row_label || ''} - Seat ${ticket.seat_number || ticket.seat_id}`, 14, 58);
        doc.text(`Tier: ${ticket.tier || ticket.category || 'Standard'}`, 14, 66);
        doc.text(`Attendee: ${ticket.attendee_name || 'Valued Attendee'}`, 14, 74);
        doc.text(`Reference: ${ticketCode}`, 14, 82);
      }

      doc.save(filename);
      return doc;
    } catch (err) {
      console.error('Failed to export ticket as PDF:', err);
      throw err;
    }
  }
}

export const ticketExportService = new TicketExportService();
export { TicketExportService };
