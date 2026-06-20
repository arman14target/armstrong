"use client";

import {
  forwardRef,
  useEffect,
  useRef,
  type InputHTMLAttributes,
} from "react";
import { useNumericKeyboard } from "@/contexts/NumericKeyboardContext";

export interface NumericKeyboardInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "readOnly" | "onChange"> {
  value: string;
  onValueChange: (value: string) => void;
  onIncrement?: () => void;
  onDecrement?: () => void;
  onKeyboardDone?: () => void;
  allowDecimal?: boolean;
}

export const NumericKeyboardInput = forwardRef<
  HTMLInputElement,
  NumericKeyboardInputProps
>(function NumericKeyboardInput(
  {
    value,
    onValueChange,
    onIncrement,
    onDecrement,
    onKeyboardDone,
    allowDecimal = false,
    onFocus,
    onBlur,
    onPointerDown,
    inputMode,
    type = "text",
    ...props
  },
  forwardedRef,
) {
  const {
    isTouchDevice,
    preferNativeKeyboard,
    open,
    updateSession,
    enableNativeKeyboard,
    close,
  } = useNumericKeyboard();
  const localRef = useRef<HTMLInputElement>(null);
  const focusedRef = useRef(false);
  const blurTimeoutRef = useRef<number | null>(null);
  const useCustomKeyboard = isTouchDevice && !preferNativeKeyboard;

  const clearBlurTimeout = () => {
    if (blurTimeoutRef.current !== null) {
      window.clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
  };

  const setRefs = (node: HTMLInputElement | null) => {
    localRef.current = node;
    if (typeof forwardedRef === "function") {
      forwardedRef(node);
    } else if (forwardedRef) {
      forwardedRef.current = node;
    }
  };

  const switchToNativeKeyboard = () => {
    enableNativeKeyboard();
    focusedRef.current = true;
    requestAnimationFrame(() => {
      const input = localRef.current;
      if (!input) {
        return;
      }
      input.focus();
      input.select();
    });
  };

  const buildSession = () => ({
    value,
    onChange: onValueChange,
    onIncrement,
    onDecrement,
    onDone: onKeyboardDone,
    onUseNativeKeyboard: switchToNativeKeyboard,
    inputRef: localRef,
    allowDecimal,
  });

  useEffect(() => {
    return () => {
      clearBlurTimeout();
      if (focusedRef.current) {
        close(localRef);
      }
    };
  }, [close]);

  useEffect(() => {
    if (!useCustomKeyboard || !focusedRef.current) {
      return;
    }

    updateSession({
      value,
      onChange: onValueChange,
      onIncrement,
      onDecrement,
      onDone: onKeyboardDone,
      onUseNativeKeyboard: switchToNativeKeyboard,
      inputRef: localRef,
      allowDecimal,
    });
  }, [
    allowDecimal,
    onDecrement,
    onIncrement,
    onKeyboardDone,
    onValueChange,
    updateSession,
    useCustomKeyboard,
    value,
  ]);

  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    onFocus?.(event);

    if (!useCustomKeyboard) {
      return;
    }

    clearBlurTimeout();
    focusedRef.current = true;
    open(buildSession());
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLInputElement>) => {
    onPointerDown?.(event);

    if (!useCustomKeyboard || event.defaultPrevented) {
      return;
    }

    event.preventDefault();
    clearBlurTimeout();
    focusedRef.current = true;

    const input = localRef.current;
    if (input) {
      input.focus({ preventScroll: true });
      input.select();
    }

    open(buildSession());
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    onBlur?.(event);

    if (!useCustomKeyboard) {
      focusedRef.current = false;
      return;
    }

    clearBlurTimeout();
    blurTimeoutRef.current = window.setTimeout(() => {
      blurTimeoutRef.current = null;
      const active = document.activeElement;
      if (
        active?.closest(".numeric-keyboard") ||
        active?.hasAttribute("data-numeric-keyboard-input")
      ) {
        return;
      }

      focusedRef.current = false;
      close(localRef);
    }, 120);
  };

  return (
    <input
      {...props}
      ref={setRefs}
      data-numeric-keyboard-input=""
      type={useCustomKeyboard ? "text" : type}
      inputMode={useCustomKeyboard ? "none" : inputMode}
      readOnly={useCustomKeyboard || undefined}
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
      value={value}
      onChange={(event) => {
        if (!useCustomKeyboard) {
          onValueChange(event.target.value);
        }
      }}
      onFocus={handleFocus}
      onPointerDown={handlePointerDown}
      onBlur={handleBlur}
    />
  );
});
