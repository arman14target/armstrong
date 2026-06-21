"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { ChevronDownIcon, KeyboardIcon } from "@/components/icons/ActionIcons";
import { useTouchDevice } from "@/lib/useTouchDevice";
import { cn } from "@/lib/cn";

export interface NumericKeyboardSession {
  value: string;
  onChange: (value: string) => void;
  onIncrement?: () => void;
  onDecrement?: () => void;
  onDone?: () => void;
  inputRef: RefObject<HTMLInputElement | null>;
  allowDecimal?: boolean;
}

interface NumericKeyboardContextValue {
  isTouchDevice: boolean;
  isOpen: boolean;
  activeInputRef: RefObject<HTMLInputElement | null> | null;
  open: (session: NumericKeyboardSession) => void;
  updateSession: (session: NumericKeyboardSession) => void;
  close: (forInput?: RefObject<HTMLInputElement | null>) => void;
}

const NumericKeyboardContext = createContext<NumericKeyboardContextValue | null>(null);

const NUMERIC_INPUT_SELECTOR = "[data-numeric-keyboard-input]";

function applyDigit(
  current: string,
  digit: string,
  input: HTMLInputElement,
): string {
  const start = input.selectionStart ?? current.length;
  const end = input.selectionEnd ?? current.length;

  if (start !== end || (start === 0 && end === current.length && current !== "")) {
    return digit;
  }

  return `${current.slice(0, start)}${digit}${current.slice(end)}`;
}

function applyBackspace(current: string, input: HTMLInputElement): string {
  const start = input.selectionStart ?? current.length;
  const end = input.selectionEnd ?? current.length;

  if (start !== end) {
    return `${current.slice(0, start)}${current.slice(end)}`;
  }

  if (start === 0) {
    return current;
  }

  return `${current.slice(0, start - 1)}${current.slice(start)}`;
}

function applyDecimal(current: string, input: HTMLInputElement): string {
  if (current.includes(".")) {
    return current;
  }

  const start = input.selectionStart ?? current.length;
  const end = input.selectionEnd ?? current.length;

  if (start !== end || current === "") {
    return "0.";
  }

  return `${current.slice(0, start)}.${current.slice(end)}`;
}

function focusInputEnd(input: HTMLInputElement, value: string) {
  input.value = value;
  const position = value.length;
  input.setSelectionRange(position, position);
}

function getVisibleNumericInputs(): HTMLInputElement[] {
  return Array.from(document.querySelectorAll<HTMLInputElement>(NUMERIC_INPUT_SELECTOR)).filter(
    (input) => !input.disabled && input.getClientRects().length > 0,
  );
}

function NumericKeyboardPanel({
  session,
  onClose,
}: {
  session: NumericKeyboardSession;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const input = session.inputRef.current;
    if (!input) {
      return;
    }

    input.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [session.inputRef]);

  useEffect(() => {
    document.body.classList.add("numeric-keyboard-open");
    return () => {
      document.body.classList.remove("numeric-keyboard-open");
    };
  }, []);

  const updateValue = useCallback(
    (nextValue: string) => {
      const input = session.inputRef.current;
      session.onChange(nextValue);

      if (!input) {
        return;
      }

      requestAnimationFrame(() => focusInputEnd(input, nextValue));
    },
    [session],
  );

  const handleDigit = (digit: string) => {
    const input = session.inputRef.current;
    if (!input) {
      updateValue(session.value === "" ? digit : `${session.value}${digit}`);
      return;
    }

    updateValue(applyDigit(session.value, digit, input));
  };

  const handleDecimal = () => {
    const input = session.inputRef.current;
    if (!input) {
      updateValue(session.value.includes(".") ? session.value : `${session.value || "0"}.`);
      return;
    }

    updateValue(applyDecimal(session.value, input));
  };

  const handleBackspace = () => {
    const input = session.inputRef.current;
    if (!input) {
      updateValue(session.value.slice(0, -1));
      return;
    }

    updateValue(applyBackspace(session.value, input));
  };

  const finishInput = () => {
    session.onDone?.();
    session.inputRef.current?.blur();
    onClose();
  };

  const handleNext = () => {
    const current = session.inputRef.current;
    if (!current) {
      return;
    }

    const inputs = getVisibleNumericInputs();
    const index = inputs.indexOf(current);

    if (index >= 0 && index < inputs.length - 1) {
      const nextInput = inputs[index + 1];
      nextInput.focus();
      nextInput.select();
      return;
    }

    finishInput();
  };

  const preventFocusSteal = (event: React.PointerEvent) => {
    event.preventDefault();
  };

  const runKeyAction = (action: () => void) => (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    action();
  };

  const digitKeys = ["7", "8", "9", "4", "5", "6", "1", "2", "3"] as const;

  return (
    <div
      ref={panelRef}
      className="numeric-keyboard"
      role="group"
      aria-label="Numeric keypad"
      onPointerDown={preventFocusSteal}
    >
      <div className="numeric-keyboard__body">
        <div className="numeric-keyboard__digits">
          {digitKeys.map((digit) => (
            <button
              key={digit}
              type="button"
              className="numeric-keyboard__key"
              onPointerDown={runKeyAction(() => handleDigit(digit))}
            >
              {digit}
            </button>
          ))}
          {session.allowDecimal ? (
            <button
              type="button"
              className="numeric-keyboard__key"
              onPointerDown={runKeyAction(handleDecimal)}
            >
              .
            </button>
          ) : (
            <span className="numeric-keyboard__spacer" aria-hidden />
          )}
          <button
            type="button"
            className="numeric-keyboard__key"
            onPointerDown={runKeyAction(() => handleDigit("0"))}
          >
            0
          </button>
          <button
            type="button"
            className="numeric-keyboard__key"
            onPointerDown={runKeyAction(handleBackspace)}
            aria-label="Backspace"
          >
            ⌫
          </button>
        </div>

        <div className="numeric-keyboard__side">
          <button
            type="button"
            className="numeric-keyboard__side-key numeric-keyboard__side-key--dismiss"
            aria-label="Close keyboard"
            onPointerDown={runKeyAction(finishInput)}
          >
            <span className="numeric-keyboard__dismiss-icon">
              <KeyboardIcon className="size-4" />
              <ChevronDownIcon className="numeric-keyboard__dismiss-chevron size-3" />
            </span>
          </button>
          <button
            type="button"
            className="numeric-keyboard__side-key numeric-keyboard__side-key--plus"
            aria-label="Increase value"
            onPointerDown={runKeyAction(() => session.onIncrement?.())}
          >
            +
          </button>
          <button
            type="button"
            className="numeric-keyboard__side-key numeric-keyboard__side-key--minus"
            aria-label="Decrease value"
            onPointerDown={runKeyAction(() => session.onDecrement?.())}
          >
            −
          </button>
          <button
            type="button"
            className={cn(
              "numeric-keyboard__side-key",
              "numeric-keyboard__side-key--next",
            )}
            onPointerDown={runKeyAction(handleNext)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export function NumericKeyboardProvider({ children }: { children: ReactNode }) {
  const isTouchDevice = useTouchDevice();
  const [session, setSession] = useState<NumericKeyboardSession | null>(null);

  useEffect(() => {
    if (!session) {
      return;
    }

    const handleOutsidePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      if (target.closest(".numeric-keyboard")) {
        return;
      }

      if (target.closest(NUMERIC_INPUT_SELECTOR)) {
        return;
      }

      session.onDone?.();
      session.inputRef.current?.blur();
      setSession(null);
    };

    document.addEventListener("pointerdown", handleOutsidePointerDown, true);
    return () => {
      document.removeEventListener("pointerdown", handleOutsidePointerDown, true);
    };
  }, [session]);

  const close = useCallback((forInput?: RefObject<HTMLInputElement | null>) => {
    setSession((current) => {
      if (forInput && current?.inputRef !== forInput) {
        return current;
      }
      return null;
    });
  }, []);

  const open = useCallback((nextSession: NumericKeyboardSession) => {
    setSession(nextSession);
  }, []);

  const updateSession = useCallback((nextSession: NumericKeyboardSession) => {
    setSession((current) => {
      if (current?.inputRef !== nextSession.inputRef) {
        return current;
      }
      return nextSession;
    });
  }, []);

  const value = useMemo(
    () => ({
      isTouchDevice,
      isOpen: session !== null,
      activeInputRef: session?.inputRef ?? null,
      open,
      updateSession,
      close,
    }),
    [close, isTouchDevice, open, session, updateSession],
  );

  return (
    <NumericKeyboardContext.Provider value={value}>
      {children}
      {isTouchDevice && session ? (
        <NumericKeyboardPanel session={session} onClose={close} />
      ) : null}
    </NumericKeyboardContext.Provider>
  );
}

export function useNumericKeyboard(): NumericKeyboardContextValue {
  const context = useContext(NumericKeyboardContext);
  if (!context) {
    throw new Error("useNumericKeyboard must be used within NumericKeyboardProvider");
  }
  return context;
}
