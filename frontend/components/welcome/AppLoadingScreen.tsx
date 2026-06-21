import { WelcomeBrand } from "@/components/welcome/WelcomeBrand";
import { WelcomeStrengthBackground } from "@/components/welcome/WelcomeStrengthBackground";

export function AppLoadingScreen() {
  return (
    <div className="app-loading" aria-busy="true" aria-label="Loading Armstrong">
      <div className="app-loading__stack">
        <WelcomeBrand loading />
        <WelcomeStrengthBackground placement="below" />
      </div>
    </div>
  );
}
