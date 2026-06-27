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
import { createPortal } from "react-dom";
import { ChevronDownIcon, KeyboardIcon } from "@/components/icons/ActionIcons";
import { useTouchDevice } from "@/lib/useTouchDevice";
import {
  readNativeKeyboardPreference,
  writeNativeKeyboardPreference,
} from "@/lib/nativeKeyboardPreference";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n/t";

export interface NumericKeyboardSession {
  value: string;
  onChange: (value: string) => void;
  onIncrement?: () => void;
  onDecrement?: () => void;
  onDone?: () => void;
  onUseNativeKeyboard?: () => void;
  inputRef: RefObject<HTMLInputElement | null>;
  allowDecimal?: boolean;
}

interface NumericKeyboardContextValue {
  isTouchDevice: boolean;
  preferNativeKeyboard: boolean;
  isOpen: boolean;
  open: (session: NumericKeyboardSession) => void;
  updateSession: (session: NumericKeyboardSession) => void;
  enableNativeKeyboard: () => void;
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

  const handleUseNativeKeyboard = () => {
    session.onUseNativeKeyboard?.();
    onClose();
  };

  const preventFocusSteal = (event: React.PointerEvent) => {
    event.preventDefault();
  };

  const digitKeys = ["7", "8", "9", "4", "5", "6", "1", "2", "3"] as const;

  return (
    <div
      ref={panelRef}
      className="numeric-keyboard"
      role="group"
      aria-label={t("keyboard.keypadAria")}
      onPointerDown={preventFocusSteal}
    >
      <div className="numeric-keyboard__body">
        <div className="numeric-keyboard__digits">
          {digitKeys.map((digit) => (
            <button
              key={digit}
              type="button"
              className="numeric-keyboard__key"
              onClick={() => handleDigit(digit)}
            >
              {digit}
            </button>
          ))}
          {session.allowDecimal ? (
            <button
              type="button"
              className="numeric-keyboard__key"
              onClick={handleDecimal}
            >
              .
            </button>
          ) : (
            <span className="numeric-keyboard__spacer" aria-hidden />
          )}
          <button
            type="button"
            className="numeric-keyboard__key"
            onClick={() => handleDigit("0")}
          >
            0
          </button>
          <button
            type="button"
            className="numeric-keyboard__key"
            onClick={handleBackspace}
            aria-label={t("keyboard.backspaceAria")}
          >
            ⌫
          </button>
        </div>

        <div className="numeric-keyboard__side">
          <button
            type="button"
            className="numeric-keyboard__side-key numeric-keyboard__side-key--native"
            aria-label={t("keyboard.hideCustomAria")}
            onClick={handleUseNativeKeyboard}
          >
            <span className="numeric-keyboard__native-icon">
              <KeyboardIcon className="size-4" />
              <ChevronDownIcon className="numeric-keyboard__native-chevron size-3" />
            </span>
          </button>
          <button
            type="button"
            className="numeric-keyboard__side-key numeric-keyboard__side-key--plus"
            aria-label={t("keyboard.increaseAria")}
            onClick={() => session.onIncrement?.()}
          >
            +
          </button>
          <button
            type="button"
            className="numeric-keyboard__side-key numeric-keyboard__side-key--minus"
            aria-label={t("keyboard.decreaseAria")}
            onClick={() => session.onDecrement?.()}
          >
            −
          </button>
          <button
            type="button"
            className={cn(
              "numeric-keyboard__side-key",
              "numeric-keyboard__side-key--next",
            )}
            onClick={handleNext}
          >
            {t("keyboard.next")}
          </button>
        </div>
      </div>
    </div>
  );
}

export function NumericKeyboardProvider({ children }: { children: ReactNode }) {
  const isTouchDevice = useTouchDevice();
  const [session, setSession] = useState<NumericKeyboardSession | null>(null);
  const [preferNativeKeyboard, setPreferNativeKeyboard] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setPreferNativeKeyboard(readNativeKeyboardPreference());
  }, []);

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

  const enableNativeKeyboard = useCallback(() => {
    writeNativeKeyboardPreference(true);
    setPreferNativeKeyboard(true);
  }, []);

  const value = useMemo(
    () => ({
      isTouchDevice,
      preferNativeKeyboard,
      isOpen: session !== null,
      open,
      updateSession,
      enableNativeKeyboard,
      close,
    }),
    [
      close,
      enableNativeKeyboard,
      isTouchDevice,
      open,
      preferNativeKeyboard,
      session,
      updateSession,
    ],
  );

  return (
    <NumericKeyboardContext.Provider value={value}>
      {children}
      {mounted && isTouchDevice && session && !preferNativeKeyboard
        ? createPortal(
            <NumericKeyboardPanel session={session} onClose={close} />,
            document.body,
          )
        : null}
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
