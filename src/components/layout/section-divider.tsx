import { Rail, RailViewport } from "@/components/layout/rail";
import { cn } from "@/lib/cn";

interface SectionDividerProps {
  topLine?: boolean;
}

export function SectionDivider({ topLine = false }: SectionDividerProps) {
  return (
    <RailViewport
      className={cn(
        "diagonal-stripes border-line border-b",
        topLine && "border-t",
      )}
    >
      <Rail className="h-8" />
    </RailViewport>
  );
}
