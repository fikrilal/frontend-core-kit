import { FluidGradientText } from "@/components/fluid-gradient-text";
import { Rail, RailViewport } from "@/components/layout/rail";

export function SiteFooter() {
  return (
    <RailViewport>
      <Rail className="px-2">
        <footer className="pt-8">
          <div className="h-40 w-full overflow-hidden md:h-60">
            <FluidGradientText text="lamara" />
          </div>
        </footer>
      </Rail>
    </RailViewport>
  );
}
