import { useState, useCallback, useRef } from 'react';

/**
 * 60fps Pan and Zoom engine using native requestAnimationFrame transforms
 */
export function usePanZoom(initialTransform = { x: 0, y: 0, scale: 1 }) {
  const [transform, setTransform] = useState(initialTransform);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const transformRef = useRef(initialTransform);
  const rafIdRef = useRef(null);

  // Sync ref with state
  transformRef.current = transform;

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

  const onWheel = useCallback((e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setTransform((prev) => {
      const nextScale = Math.min(Math.max(prev.scale * zoomFactor, 0.5), 3.5);
      return { ...prev, scale: Number(nextScale.toFixed(2)) };
    });
  }, []);

  return {
    transform,
    zoomIn,
    zoomOut,
    resetTransform,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onWheel,
  };
}
