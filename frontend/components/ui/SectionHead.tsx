interface SectionHeadProps {
  index?: string;
  title: string;
}

export function SectionHead({ index, title }: SectionHeadProps) {
  return (
    <div className="section-head">
      {index ? (
        <span className="text-[15px] text-magenta">{index}</span>
      ) : null}
      <h2 className="font-display text-xl tracking-[2px] text-heading uppercase sm:text-3xl">
        {title}
      </h2>
      <span className="h-px flex-1 bg-gradient-to-r from-line to-transparent" />
    </div>
  );
}
