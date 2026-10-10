import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

/**
 * Hardware-Accelerated Camera Scanner Component
 * Prioritizes native BarcodeDetector API (<10ms) and falls back to Html5Qrcode.
 * Includes torch switch, environment camera selection, 1.5s debounce loop,
 * and robust React StrictMode lifecycle guards to prevent "Cannot stop" errors and AbortError.
 */
export function CameraScanner({
  onScan,
  isPaused = false,
  autoResetDelay = 1500,
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const lastScanTimeRef = useRef(0);
  const isScanningActiveRef = useRef(true);
  const isMountedRef = useRef(true);
  const isStartingRef = useRef(false);

  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [engineType, setEngineType] = useState('detecting'); // 'barcode-detector' | 'html5-qrcode' | 'error'

  // Sync ref with prop
  useEffect(() => {
    isScanningActiveRef.current = !isPaused;
  }, [isPaused]);

  // Handle successful code capture with auto-reset debounce
  const handleDecodedCode = useCallback((decodedText) => {
    if (!isScanningActiveRef.current) return;

    const now = Date.now();
    if (now - lastScanTimeRef.current < autoResetDelay) {
      return;
    }

    lastScanTimeRef.current = now;
    if (onScan) {
      onScan(decodedText);
    }
  }, [autoResetDelay, onScan]);

  // Toggle flashlight / torch
  const toggleTorch = useCallback(async () => {
    if (!streamRef.current) return;
    try {
      const track = streamRef.current.getVideoTracks()[0];
      if (track) {
        const nextState = !isTorchOn;
        await track.applyConstraints({
          advanced: [{ torch: nextState }],
        });
        setIsTorchOn(nextState);
      }
    } catch (err) {
      console.warn('Torch toggle failed:', err);
    }
  }, [isTorchOn]);

  // Safe scanner shutdown helper
  const stopScanner = useCallback(async () => {
    // 1. Cancel active animation frame
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }

    // 2. Pause video element and detach stream
    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      } catch {
        // Safe ignore
      }
    }

    // 3. Stop stream tracks
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => track.stop());
      } catch {
        // Safe ignore
      }
      streamRef.current = null;
    }

    // 4. Safely stop Html5Qrcode if active and not already stopped
    const scanner = html5QrCodeRef.current;
    if (scanner) {
      try {
        if (scanner.isScanning) {
          await scanner.stop();
        }
      } catch (err) {
        console.warn('[CameraScanner] Safe ignore on stop:', err?.message || err);
      }

      try {
        scanner.clear();
      } catch {
        // Safe ignore
      }
      html5QrCodeRef.current = null;
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    const scannerContainerId = 'gate-qr-reader';

    async function startScanner() {
      setCameraError(null);

      // Check for native BarcodeDetector support
      const hasNativeBarcodeDetector =
        typeof window !== 'undefined' &&
        'BarcodeDetector' in window &&
        typeof window.BarcodeDetector === 'function';

      if (hasNativeBarcodeDetector) {
        try {
          const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
          setEngineType('barcode-detector');

          isStartingRef.current = true;
          // Request environment camera stream
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: 'environment' },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          });
          isStartingRef.current = false;

          // If unmounted during getUserMedia async resolution, abort immediately
          if (!isMountedRef.current) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }

          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            try {
              await videoRef.current.play();
            } catch (playErr) {
              if (playErr.name !== 'AbortError') {
                console.error('Video play error:', playErr);
              }
            }
          }

          // Check torch capability
          const track = stream.getVideoTracks()[0];
          const capabilities = track?.getCapabilities ? track.getCapabilities() : {};
          if (capabilities.torch) {
            setHasTorch(true);
          }

          // Native Barcode Detection loop
          let isDetecting = false;
          const detectLoop = async () => {
            if (!isMountedRef.current) return;

            if (
              videoRef.current &&
              videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA &&
              isScanningActiveRef.current &&
              !isDetecting
            ) {
              isDetecting = true;
              try {
                const barcodes = await detector.detect(videoRef.current);
                if (barcodes.length > 0 && barcodes[0].rawValue) {
                  handleDecodedCode(barcodes[0].rawValue);
                }
              } catch {
                // Ignore transient frame decode drops
              } finally {
                isDetecting = false;
              }
            }

            if (isMountedRef.current) {
              animFrameIdRef.current = requestAnimationFrame(detectLoop);
            }
          };

          animFrameIdRef.current = requestAnimationFrame(detectLoop);
          return;
        } catch (nativeErr) {
          isStartingRef.current = false;
          if (!isMountedRef.current) return;
          console.warn('Native BarcodeDetector stream init failed, falling back to Html5Qrcode:', nativeErr);
        }
      }

      // Fallback: Html5Qrcode
      try {
        setEngineType('html5-qrcode');
        const scannerInstance = new Html5Qrcode(scannerContainerId);
        html5QrCodeRef.current = scannerInstance;

        const config = {
          fps: 20,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        };

        isStartingRef.current = true;
        await scannerInstance.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            handleDecodedCode(decodedText);
          },
          (_errorMessage) => {
            // Frame scan missed, ignore
          }
        );
        isStartingRef.current = false;

        // If component unmounted while starting was resolving, stop immediately
        if (!isMountedRef.current) {
          await stopScanner();
          return;
        }

        // Check torch in Html5Qrcode
        try {
          const capabilities = scannerInstance.getRunningTrackCapabilities();
          if (capabilities?.torch) {
            setHasTorch(true);
          }
        } catch {
          // Safe ignore
        }
      } catch (err) {
        isStartingRef.current = false;
        if (!isMountedRef.current) return;
        console.error('All camera scanner engines failed:', err);
        setCameraError(
          err.message || 'Unable to access camera. Please check camera permissions in your browser.'
        );
        setEngineType('error');
      }
    }

    startScanner();

    return () => {
      isMountedRef.current = false;
      stopScanner();
    };
  }, [handleDecodedCode, stopScanner]);

  return (
    <div className="camera-scanner-wrapper" data-testid="camera-scanner-container">
      {/* Native Video Surface */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className={`native-scanner-video ${engineType === 'barcode-detector' ? 'active' : 'hidden'}`}
        data-testid="native-scanner-video"
      />

      {/* Fallback Container for Html5Qrcode */}
      <div
        id="gate-qr-reader"
        className={`html5-qr-reader-target ${engineType === 'html5-qrcode' ? 'active' : 'hidden'}`}
      />

      {/* Viewfinder Target / Laser Reticle */}
      <div className="scanner-viewfinder-overlay" aria-hidden="true">
        <div className={`viewfinder-reticle ${isPaused ? 'paused' : 'scanning'}`}>
          <div className="reticle-corner top-left" />
          <div className="reticle-corner top-right" />
          <div className="reticle-corner bottom-left" />
          <div className="reticle-corner bottom-right" />
          <div className="scanning-laser-line" />
        </div>
      </div>

      {/* Camera Controls Bar */}
      <div className="scanner-controls-overlay">
        {hasTorch && (
          <button
            type="button"
            className={`btn-scanner-control torch-btn ${isTorchOn ? 'active' : ''}`}
            onClick={toggleTorch}
            data-testid="btn-toggle-torch"
            aria-label={isTorchOn ? 'Turn Off Flashlight' : 'Turn On Flashlight'}
          >
            {isTorchOn ? '🔦 Flash ON' : '💡 Flash'}
          </button>
        )}

        <div className="engine-badge-pill" data-testid="scanner-engine-pill">
          {engineType === 'barcode-detector' ? '⚡ Native 10ms' : '📷 Web Scanner'}
        </div>
      </div>

      {/* Error State */}
      {cameraError && (
        <div className="camera-error-banner" data-testid="camera-error-banner" role="alert">
          <span className="error-icon">⚠️</span>
          <div className="error-text">
            <strong>Camera Error:</strong> {cameraError}
          </div>
        </div>
      )}
    </div>
  );
}
