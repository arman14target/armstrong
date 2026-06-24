import type { PointerEvent as ReactPointerEvent } from "react";

/** First touch fires navigation immediately; avoids sticky :hover double-tap on mobile. */
export function touchNavHandlers(action: () => void) {
  return {
    onClick: action,
    onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (event.pointerType !== "touch") {
        return;
      }

      event.preventDefault();
      action();
    },
  };
}
