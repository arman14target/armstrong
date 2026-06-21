interface WelcomeBackButtonProps {
  onClick: () => void;
  label?: string;
}

export function WelcomeBackButton({ onClick, label = "Back" }: WelcomeBackButtonProps) {
  return (
    <button type="button" className="welcome-back" onClick={onClick}>
      <span className="welcome-back__flash" aria-hidden>
        ‹
      </span>
      {label}
    </button>
  );
}
