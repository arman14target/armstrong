"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";

const ENTER_MS = 420;
const EXIT_MS = 340;
const SNAP_MS = 380;
const DISMISS_RATIO = 0.2;
const DISMISS_MIN_PX = 108;
const VELOCITY_DISMISS = 0.55;

function getDismissThreshold() {
  return Math.max(DISMISS_MIN_PX, window.innerHeight * DISMISS_RATIO);
}

interface UseInteractiveBottomSheetOptions {
  isActive: boolean;
  onDismiss: () => void;
  /** When true, onDismiss runs as soon as dismiss starts (not after the exit animation). */
  notifyDismissOnStart?: boolean;
  scrollRef: RefObject<HTMLElement | null>;
}

export function useInteractiveBottomSheet({
  isActive,
  onDismiss,
  notifyDismissOnStart = false,
  scrollRef,
}: UseInteractiveBottomSheetOptions) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [present, setPresent] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [motionEnabled, setMotionEnabled] = useState(false);

  const dragOffsetRef = useRef(0);
  const isDraggingRef = useRef(false);
  const isExitingRef = useRef(false);
  const dragPointerId = useRef<number | null>(null);
  const dragStartY = useRef(0);
  const dragStartOffset = useRef(0);
  const dragFromScroll = useRef(false);
  const lastMoveY = useRef(0);
  const lastMoveTime = useRef(0);
  const velocityY = useRef(0);
  const exitTimerRef = useRef<number | null>(null);
  const wasActiveRef = useRef(false);

  useEffect(() => {
    dragOffsetRef.current = dragOffset;
  }, [dragOffset]);

  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

  useEffect(() => {
    isExitingRef.current = isExiting;
  }, [isExiting]);

  const clearExitTimer = useCallback(() => {
    if (exitTimerRef.current !== null) {
      window.clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
  }, []);

  const finishExit = useCallback(() => {
    clearExitTimer();
    isExitingRef.current = false;
    wasActiveRef.current = false;
    setIsExiting(false);
    setPresent(false);
    setMotionEnabled(false);
    setDragOffset(0);
    dragOffsetRef.current = 0;
    isDraggingRef.current = false;
    setIsDragging(false);
    if (!notifyDismissOnStart) {
      onDismiss();
    }
  }, [clearExitTimer, notifyDismissOnStart, onDismiss]);

  const animateDismiss = useCallback(() => {
    if (isExitingRef.current) {
      return;
    }

    isExitingRef.current = true;
    isDraggingRef.current = false;
    setIsDragging(false);
    setIsExiting(true);
    setMotionEnabled(true);
    if (notifyDismissOnStart) {
      onDismiss();
    }
    const exitOffset = window.innerHeight;
    setDragOffset(exitOffset);
    dragOffsetRef.current = exitOffset;
    clearExitTimer();
    exitTimerRef.current = window.setTimeout(finishExit, EXIT_MS);
  }, [clearExitTimer, finishExit, notifyDismissOnStart, onDismiss]);

  const snapBack = useCallback(() => {
    isDraggingRef.current = false;
    setIsDragging(false);
    setMotionEnabled(true);
    setDragOffset(0);
    dragOffsetRef.current = 0;
  }, []);

  const resolveDragEnd = useCallback(
    (offset: number) => {
      const threshold = getDismissThreshold();
      const shouldDismiss =
        offset > threshold || velocityY.current > VELOCITY_DISMISS;

      if (shouldDismiss) {
        animateDismiss();
        return;
      }

      snapBack();
    },
    [animateDismiss, snapBack],
  );

  useEffect(() => {
    if (isActive) {
      if (wasActiveRef.current && present) {
        return;
      }

      wasActiveRef.current = true;
      clearExitTimer();
      isExitingRef.current = false;
      setIsExiting(false);
      setPresent(true);
      setMotionEnabled(false);
      const startOffset = window.innerHeight;
      setDragOffset(startOffset);
      dragOffsetRef.current = startOffset;
      isDraggingRef.current = false;
      setIsDragging(false);

      const enterFrame = window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          setMotionEnabled(true);
          setDragOffset(0);
          dragOffsetRef.current = 0;
        });
      });

      return () => window.cancelAnimationFrame(enterFrame);
    }

    wasActiveRef.current = false;

    if (present && !isExitingRef.current) {
      animateDismiss();
    }
  }, [animateDismiss, clearExitTimer, isActive, present]);

  useEffect(() => () => clearExitTimer(), [clearExitTimer]);

  const beginDrag = useCallback(
    (clientY: number, pointerId: number | null, fromScroll: boolean) => {
      if (isExitingRef.current) {
        return;
      }

      dragPointerId.current = pointerId;
      dragStartY.current = clientY;
      dragStartOffset.current = dragOffsetRef.current;
      dragFromScroll.current = fromScroll;
      lastMoveY.current = clientY;
      lastMoveTime.current = performance.now();
      velocityY.current = 0;
      isDraggingRef.current = true;
      setIsDragging(true);
      setMotionEnabled(false);
    },
    [],
  );

  const updateDrag = useCallback((clientY: number) => {
    const now = performance.now();
    const dt = now - lastMoveTime.current;
    if (dt > 0) {
      velocityY.current = (clientY - lastMoveY.current) / dt;
    }
    lastMoveY.current = clientY;
    lastMoveTime.current = now;

    const delta = clientY - dragStartY.current;
    const nextOffset = Math.max(0, dragStartOffset.current + delta);
    dragOffsetRef.current = nextOffset;
    setDragOffset(nextOffset);
  }, []);

  const endDrag = useCallback(() => {
    if (!isDraggingRef.current) {
      return;
    }

    dragPointerId.current = null;
    resolveDragEnd(dragOffsetRef.current);
  }, [resolveDragEnd]);

  const handleProps = {
    onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
      if (isExitingRef.current) {
        return;
      }

      beginDrag(event.clientY, event.pointerId, false);
      event.currentTarget.setPointerCapture(event.pointerId);
      event.preventDefault();
    },
    onPointerMove: (event: React.PointerEvent<HTMLElement>) => {
      if (dragPointerId.current !== event.pointerId || !isDraggingRef.current) {
        return;
      }

      updateDrag(event.clientY);
      event.preventDefault();
    },
    onPointerUp: (event: React.PointerEvent<HTMLElement>) => {
      if (dragPointerId.current !== event.pointerId) {
        return;
      }

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      endDrag();
    },
    onPointerCancel: (event: React.PointerEvent<HTMLElement>) => {
      if (dragPointerId.current !== event.pointerId) {
        return;
      }

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      snapBack();
      dragPointerId.current = null;
    },
  };

  const scrollTouchHandlers = {
    onTouchStart: (event: React.TouchEvent<HTMLDivElement>) => {
      if (isExitingRef.current) {
        return;
      }

      const scrollTop = scrollRef.current?.scrollTop ?? 0;
      if (scrollTop > 0) {
        dragFromScroll.current = false;
        return;
      }

      const touch = event.touches[0];
      if (!touch) {
        return;
      }

      beginDrag(touch.clientY, null, true);
    },
    onTouchMove: (event: React.TouchEvent<HTMLDivElement>) => {
      if (!isDraggingRef.current || !dragFromScroll.current) {
        return;
      }

      const touch = event.touches[0];
      if (!touch) {
        return;
      }

      const delta = touch.clientY - dragStartY.current;
      if (delta > 0 || dragOffsetRef.current > 0) {
        event.preventDefault();
      }

      updateDrag(touch.clientY);
    },
    onTouchEnd: () => {
      if (!dragFromScroll.current || !isDraggingRef.current) {
        return;
      }

      endDrag();
      dragFromScroll.current = false;
    },
    onTouchCancel: () => {
      if (!dragFromScroll.current) {
        return;
      }

      snapBack();
      dragFromScroll.current = false;
      dragPointerId.current = null;
    },
  };

  const viewportHeight =
    typeof window !== "undefined" ? window.innerHeight : 800;
  const backdropOpacity = Math.max(
    0,
    Math.min(1, 1 - dragOffset / (viewportHeight * 0.72)),
  );

  const easing = "cubic-bezier(0.32, 0.72, 0, 1)";
  const panelTransition = isDragging
    ? "none"
    : motionEnabled
      ? `transform ${isExiting ? EXIT_MS : enteredMotionDuration(dragOffset)}ms ${easing}`
      : "none";

  const backdropTransition = isDragging
    ? "none"
    : motionEnabled
      ? `opacity ${isExiting ? EXIT_MS : ENTER_MS}ms ease`
      : "none";

  const panelStyle: CSSProperties = {
    transform: `translate3d(0, ${dragOffset}px, 0)`,
    transition: panelTransition,
    willChange: isDragging ? "transform" : "auto",
  };

  const backdropStyle: CSSProperties = {
    opacity: backdropOpacity,
    transition: backdropTransition,
  };

  return {
    present,
    panelRef,
    handleProps,
    scrollTouchHandlers,
    panelStyle,
    backdropStyle,
  };
}

function enteredMotionDuration(dragOffset: number) {
  return dragOffset > 0 ? SNAP_MS : ENTER_MS;
}
