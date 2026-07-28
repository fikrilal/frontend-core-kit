import { Rail, RailViewport } from "@/components/layout/rail";
import { SectionDivider } from "@/components/layout/section-divider";

const githubUrl = "https://github.com/fikrilal/lamara";

export function SiteFooter() {
  return (
    <footer>
      <SectionDivider topLine />
      <RailViewport>
        <Rail className="flex flex-col gap-3 px-5 py-8 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground">
            Local usage visibility for people building with AI.
          </p>
          <a
            className="link-underline w-fit"
            href={githubUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            Source on GitHub
          </a>
        </Rail>
      </RailViewport>
    </footer>
  );
}
