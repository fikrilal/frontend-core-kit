import { Rail, RailViewport } from "@/components/layout/rail";
import { SectionDivider } from "@/components/layout/section-divider";

export function SiteFooter() {
  return (
    <footer>
      <SectionDivider topLine />
      <RailViewport>
        <Rail className="px-5 py-8 text-sm">
          <p className="text-muted-foreground">
            Lamara is currently under development.
          </p>
        </Rail>
      </RailViewport>
    </footer>
  );
}
