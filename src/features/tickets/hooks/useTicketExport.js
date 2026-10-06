import { useState, useCallback } from 'react';
import { ticketExportService } from '../services/ticketExportService';

/**
 * Custom hook managing ticket export state and execution (SPEC-04 / REQ-TICK-04.4)
 */
export function useTicketExport() {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [exportError, setExportError] = useState(null);

  const downloadPdf = useCallback(async (ticket, passElement = null) => {
    setIsExportingPdf(true);
    setExportError(null);
    try {
      await ticketExportService.exportTicketAsPdf(ticket, passElement);
      return { success: true };
    } catch (err) {
      const msg = err.message || 'Failed to export PDF';
      setExportError(msg);
      return { success: false, error: msg };
    } finally {
      setIsExportingPdf(false);
    }
  }, []);

  const downloadPng = useCallback(async (passElement, ticketCode) => {
    setIsExportingPng(true);
    setExportError(null);
    try {
      await ticketExportService.exportTicketAsPng(passElement, ticketCode);
      return { success: true };
    } catch (err) {
      const msg = err.message || 'Failed to export PNG';
      setExportError(msg);
      return { success: false, error: msg };
    } finally {
      setIsExportingPng(false);
    }
  }, []);

  return {
    isExportingPdf,
    isExportingPng,
    isExporting: isExportingPdf || isExportingPng,
    exportError,
    downloadPdf,
    downloadPng,
    clearExportError: () => setExportError(null),
  };
}
