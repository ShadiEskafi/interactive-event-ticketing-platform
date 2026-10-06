import { useState, useCallback, useRef, useEffect, useMemo } from 'react';

/**
 * 60fps Pan and Zoom engine using native requestAnimationFrame transforms.
 * Wheel and touch pinch zoom listeners are directly attached to the DOM element
 * inside useEffect using addEventListener with { passive: false } and e.cancelable checks,
 * eliminating "Unable to preventDefault inside passive event listener invocation" warnings.
 */
export function usePanZoom(refOrInitialTransform, maybeInitialTransform) {
  const internalRef = useRef(null);

  const isRef = Boolean(
    refOrInitialTransform &&
      typeof refOrInitialTransform === 'object' &&
      'current' in refOrInitialTransform
  );

  const containerRef = isRef ? refOrInitialTransform : internalRef;
  const initialTransform = useMemo(() => {
    return isRef
      ? (maybeInitialTransform || { x: 0, y: 0, scale: 1 })
      : (refOrInitialTransform || { x: 0, y: 0, scale: 1 });
  }, [isRef, maybeInitialTransform, refOrInitialTransform]);

  const [transform, setTransform] = useState(initialTransform);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const transformRef = useRef(initialTransform);
  const rafIdRef = useRef(null);

  // Sync ref with state outside render
  useEffect(() => {
    transformRef.current = transform;
  }, [transform]);

  const updateTransformRaf = useCallback((newTransform) => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }
    rafIdRef.current = requestAnimationFrame(() => {
      setTransform(newTransform);
    });
  }, []);

  const zoomIn = useCallback(() => {
    setTransform((prev) => {
      const nextScale = Math.min(prev.scale * 1.25, 3.5);
      return { ...prev, scale: Number(nextScale.toFixed(2)) };
    });
  }, []);

  const zoomOut = useCallback(() => {
    setTransform((prev) => {
      const nextScale = Math.max(prev.scale / 1.25, 0.5);
      return { ...prev, scale: Number(nextScale.toFixed(2)) };
    });
  }, []);

  const resetTransform = useCallback(() => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }
    setTransform(initialTransform);
  }, [initialTransform]);

  const onPointerDown = useCallback((e) => {
    // Only drag with primary mouse button or touch
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    // Do not initiate pan/drag if the pointer originated on a seat or interactive button
    if (
      e.target &&
      typeof e.target.closest === 'function' &&
      (e.target.closest('.seat-node') || e.target.closest('[data-seat-id]') || e.target.closest('button'))
    ) {
      return;
    }

    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX - transformRef.current.x,
      y: e.clientY - transformRef.current.y,
    };
    if (e.currentTarget?.setPointerCapture) {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Safe fallback in test environments
      }
    }
  }, []);

  const onPointerMove = useCallback((e) => {
    if (!isDraggingRef.current) return;
    const newX = e.clientX - dragStartRef.current.x;
    const newY = e.clientY - dragStartRef.current.y;
    updateTransformRaf({
      ...transformRef.current,
      x: newX,
      y: newY,
    });
  }, [updateTransformRaf]);

  const onPointerUp = useCallback((e) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    if (e.currentTarget?.releasePointerCapture) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Safe fallback in test environments
      }
    }
  }, []);

  // Direct DOM non-passive wheel and touch pinch zoom listeners
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const handleWheel = (e) => {
      if (e.cancelable) {
        e.preventDefault();
      }
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      setTransform((prev) => {
        const nextScale = Math.min(Math.max(prev.scale * zoomFactor, 0.5), 3.5);
        return { ...prev, scale: Number(nextScale.toFixed(2)) };
      });
    };

    let initialTouchDistance = null;
    let initialTouchScale = 1;

    const handleTouchStart = (e) => {
      if (e.touches && e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialTouchDistance = Math.hypot(dx, dy);
        initialTouchScale = transformRef.current.scale;
      }
    };

    const handleTouchMove = (e) => {
      if (e.touches && e.touches.length === 2 && initialTouchDistance) {
        if (e.cancelable) {
          e.preventDefault();
        }
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const currentDistance = Math.hypot(dx, dy);
        const factor = currentDistance / initialTouchDistance;
        const nextScale = Math.min(Math.max(initialTouchScale * factor, 0.5), 3.5);
        setTransform((prev) => ({ ...prev, scale: Number(nextScale.toFixed(2)) }));
      }
    };

    const handleTouchEnd = () => {
      initialTouchDistance = null;
    };

    element.addEventListener('wheel', handleWheel, { passive: false });
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('wheel', handleWheel);
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [containerRef]);

  return {
    transform,
    zoomIn,
    zoomOut,
    resetTransform,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    containerRef,
  };
}
