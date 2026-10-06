import { QRCodeSVG } from 'qrcode.react';

/**
 * High-Contrast QR Code Component (SPEC-04 / REQ-TICK-04.2)
 * Renders high error correction (Level H) QR code with high-contrast quiet zone
 */
export function QRCodeDisplay({
  value,
  size = 180,
  level = 'H',
  includeMargin = true,
  className = '',
}) {
  const qrString = typeof value === 'object' ? JSON.stringify(value) : String(value || '');

  return (
    <div
      className={`qr-code-wrapper ${className}`}
      data-testid="qr-code-container"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#FFFFFF',
        padding: '0.5rem',
        borderRadius: '8px',
      }}
    >
      <QRCodeSVG
        value={qrString}
        size={size}
        level={level}
        includeMargin={includeMargin}
        bgColor="#FFFFFF"
        fgColor="#000000"
        data-testid="qr-code-svg"
        aria-label="Ticket Entry QR Code"
        role="img"
      />
    </div>
  );
}
