import Image from "next/image";
import { withBasePath } from "@/lib/basePath";

export function PlanSparkIcon() {
  return (
    <Image
      src={withBasePath("/images/welcome/notebook-ai-3d-orange.png")}
      alt=""
      width={72}
      height={72}
      className="welcome-card__icon"
      aria-hidden
    />
  );
}

export function ExistingPlanIcon() {
  return (
    <Image
      src={withBasePath("/images/welcome/notebook-3d-orange.png")}
      alt=""
      width={72}
      height={72}
      className="welcome-card__icon"
      aria-hidden
    />
  );
}

export function PlainTextPlanIcon() {
  return (
    <Image
      src={withBasePath("/images/welcome/paper-3d-orange.png")}
      alt=""
      width={72}
      height={72}
      className="welcome-card__icon"
      aria-hidden
    />
  );
}

export function ManualPlanIcon() {
  return (
    <Image
      src={withBasePath("/images/welcome/phone-3d-orange.png")}
      alt=""
      width={72}
      height={72}
      className="welcome-card__icon"
      aria-hidden
    />
  );
}
