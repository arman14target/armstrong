"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { TrashIcon } from "@/components/icons/ActionIcons";
import { cn } from "@/lib/cn";

const DELETE_WIDTH = 72;
const REVEAL_THRESHOLD = 28;
const DELETE_THRESHOLD = 56;
const SWIPE_START_THRESHOLD = 8;

type SwipeMode = "idle" | "pending" | "swiping" | "cancelled";

interface SwipeToDeleteRowProps {
  onDelete: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function SwipeToDeleteRow({
  onDelete,
  disabled = false,
  children,
  className,
}: SwipeToDeleteRowProps) {
  const { t } = useTranslation();
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const startOffsetRef = useRef(0);
  const offsetRef = useRef(0);
  const pointerIdRef = useRef<number | null>(null);
  const swipeModeRef = useRef<SwipeMode>("idle");

  const clampOffset = useCallback((value: number) => {
    return Math.max(-DELETE_WIDTH, Math.min(0, value));
  }, []);

  const setOffsetValue = useCallback(
    (value: number) => {
      const clamped = clampOffset(value);
      offsetRef.current = clamped;
      setOffset(clamped);
    },
    [clampOffset],
  );

  const resetGesture = useCallback(() => {
    pointerIdRef.current = null;
    swipeModeRef.current = "idle";
    setDragging(false);
  }, []);

  const finishDrag = useCallback(
    (currentOffset: number) => {
      resetGesture();

      if (currentOffset <= -DELETE_THRESHOLD) {
        onDelete();
        setOffsetValue(0);
        return;
      }

      if (currentOffset <= -REVEAL_THRESHOLD) {
        setOffsetValue(-DELETE_WIDTH);
        return;
      }

      setOffsetValue(0);
    },
    [onDelete, resetGesture, setOffsetValue],
  );

  const handlePointerDownCapture = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (disabled || event.button > 0) {
      return;
    }

    pointerIdRef.current = event.pointerId;
    swipeModeRef.current = "pending";
    startXRef.current = event.clientX;
    startYRef.current = event.clientY;
    startOffsetRef.current = offsetRef.current;
  };

  const handlePointerMoveCapture = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (
      pointerIdRef.current !== event.pointerId ||
      swipeModeRef.current === "cancelled" ||
      swipeModeRef.current === "idle"
    ) {
      return;
    }

    const deltaX = event.clientX - startXRef.current;
    const deltaY = event.clientY - startYRef.current;

    if (swipeModeRef.current === "pending") {
      if (Math.abs(deltaX) < SWIPE_START_THRESHOLD &&
          Math.abs(deltaY) < SWIPE_START_THRESHOLD) {
        return;
      }

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        swipeModeRef.current = "swiping";
        setDragging(true);
        event.currentTarget.setPointerCapture(event.pointerId);

        const active = document.activeElement;
        if (
          active instanceof HTMLElement &&
          event.currentTarget.contains(active)
        ) {
          active.blur();
        }
      } else {
        swipeModeRef.current = "cancelled";
        return;
      }
    }

    if (swipeModeRef.current === "swiping") {
      event.preventDefault();
      setOffsetValue(startOffsetRef.current + deltaX);
    }
  };

  const handlePointerUpCapture = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (pointerIdRef.current !== event.pointerId) {
      return;
    }

    if (swipeModeRef.current === "swiping") {
      event.currentTarget.releasePointerCapture(event.pointerId);
      finishDrag(offsetRef.current);
      return;
    }

    resetGesture();
  };

  const handlePointerCancelCapture = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (pointerIdRef.current !== event.pointerId) {
      return;
    }

    if (swipeModeRef.current === "swiping") {
      event.currentTarget.releasePointerCapture(event.pointerId);
      finishDrag(offsetRef.current);
      return;
    }

    resetGesture();
  };

  const handleDeleteClick = () => {
    onDelete();
    setOffsetValue(0);
  };

  const revealProgress = Math.min(1, Math.abs(offset) / DELETE_WIDTH);

  return (
    <div className={cn("set-swipe-row", className)}>
      <button
        type="button"
        aria-label={t("sets.deleteSetAria")}
        onClick={handleDeleteClick}
        className="set-swipe-row__delete"
        style={{ opacity: revealProgress }}
      >
        <TrashIcon />
        <span className="text-[10px] font-semibold uppercase tracking-wide">
          {t("common.delete")}
        </span>
      </button>

      <div
        className={cn(
          "set-swipe-row__content",
          dragging && "set-swipe-row__content--dragging",
        )}
        style={{ transform: `translateX(${offset}px)` }}
        onPointerDownCapture={handlePointerDownCapture}
        onPointerMoveCapture={handlePointerMoveCapture}
        onPointerUpCapture={handlePointerUpCapture}
        onPointerCancelCapture={handlePointerCancelCapture}
      >
        {children}
      </div>
    </div>
  );
}
