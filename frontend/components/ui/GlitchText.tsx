import { cn } from "@/lib/cn";

interface GlitchTextProps {
  text: string;
  as?: "h1" | "h2" | "span";
  className?: string;
}

export function GlitchText({ text, as: Tag = "h1", className }: GlitchTextProps) {
  return (
    <Tag
      className={cn(
        "glitch font-display text-4xl font-black tracking-[4px] text-heading sm:text-6xl lg:text-7xl",
        className,
      )}
      data-text={text}
    >
      {text}
    </Tag>
  );
}
