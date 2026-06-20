"use client";

import {
  forwardRef,
  useEffect,
  useRef,
  type InputHTMLAttributes,
} from "react";
import { useNumericKeyboard } from "@/contexts/NumericKeyboardContext";
import { cn } from "@/lib/cn";

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
    className,
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
    isOpen,
    activeInputRef,
    open,
    updateSession,
    close,
  } = useNumericKeyboard();
  const localRef = useRef<HTMLInputElement>(null);
  const focusedRef = useRef(false);
  const useCustomKeyboard = isTouchDevice;
  const isKeyboardTarget = isOpen && activeInputRef === localRef;

  const suppressNativeKeyboard = () => {
    if (!useCustomKeyboard) {
      return;
    }

    requestAnimationFrame(() => {
      localRef.current?.blur();
    });
  };

  const setRefs = (node: HTMLInputElement | null) => {
    localRef.current = node;
    if (typeof forwardedRef === "function") {
      forwardedRef(node);
    } else if (forwardedRef) {
      forwardedRef.current = node;
    }
  };

  const buildSession = () => ({
    value,
    onChange: onValueChange,
    onIncrement,
    onDecrement,
    onDone: onKeyboardDone,
    inputRef: localRef,
    allowDecimal,
  });

  useEffect(() => {
    return () => {
      if (focusedRef.current) {
        close(localRef);
      }
    };
  }, [close]);

  useEffect(() => {
    if (isOpen) {
      return;
    }

    focusedRef.current = false;
  }, [isOpen]);

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

    focusedRef.current = true;
    open(buildSession());
    suppressNativeKeyboard();
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLInputElement>) => {
    onPointerDown?.(event);

    if (!useCustomKeyboard || event.defaultPrevented) {
      return;
    }

    event.preventDefault();
    focusedRef.current = true;

    const input = localRef.current;
    if (input) {
      input.focus({ preventScroll: true });
      input.select();
    }

    open(buildSession());
    suppressNativeKeyboard();
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    onBlur?.(event);

    if (!useCustomKeyboard) {
      focusedRef.current = false;
    }
  };

  return (
    <input
      {...props}
      ref={setRefs}
      data-numeric-keyboard-input=""
      data-numeric-keyboard-active={isKeyboardTarget ? "" : undefined}
      type={useCustomKeyboard ? "text" : type}
      inputMode={useCustomKeyboard ? "none" : inputMode}
      readOnly={useCustomKeyboard || undefined}
      className={cn(className, isKeyboardTarget && "numeric-keyboard-input--active")}
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
