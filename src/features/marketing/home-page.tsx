import { Rail, RailViewport } from "@/components/layout/rail";
import { SectionDivider } from "@/components/layout/section-divider";

const githubUrl = "https://github.com/fikrilal/lamara";

const sources = [
  { name: "Codex", status: "Supported" },
  { name: "Claude Code", status: "Supported" },
  { name: "OpenCode", status: "Supported" },
] as const;

const steps = [
  {
    number: "01",
    title: "Read local usage",
    description:
      "Lamara reads supported tools on your machine instead of proxying your prompts through another service.",
  },
  {
    number: "02",
    title: "Normalize the signal",
    description:
      "Usage from each source is translated into one clear view of tokens, cost, and freshness.",
  },
  {
    number: "03",
    title: "Keep it in reach",
    description:
      "The tray keeps today’s usage visible without opening another browser dashboard.",
  },
] as const;

export function MarketingHome() {
  return (
    <>
      <RailViewport>
        <Rail className="grid gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-12 lg:py-28">
          <section aria-labelledby="hero-title" className="max-w-2xl">
            <p className="text-ember mb-5 font-mono text-xs font-medium tracking-[0.16em] uppercase">
              Local-first desktop utility
            </p>
            <h1
              id="hero-title"
              className="max-w-xl text-4xl leading-[1.05] font-semibold tracking-[-0.04em] text-balance sm:text-6xl"
            >
              Track AI coding-tool usage from your tray.
            </h1>
            <p className="text-muted-foreground mt-6 max-w-xl text-base leading-7 text-pretty sm:text-lg">
              Lamara turns local usage from Codex, Claude Code, and OpenCode
              into one calm view of tokens, estimated cost, and data freshness.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                className="bg-foreground text-background hover:bg-foreground/85 focus-visible:ring-foreground/25 inline-flex h-10 items-center rounded-full px-5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                href={githubUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                View source
              </a>
              <a
                className="border-border hover:bg-muted focus-visible:ring-foreground/25 inline-flex h-10 items-center rounded-full border px-5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                href="#how-it-works"
              >
                How it works
              </a>
            </div>
          </section>

          <ProductPreview />
        </Rail>
      </RailViewport>

      <SectionDivider topLine />

      <RailViewport>
        <Rail className="grid lg:grid-cols-[0.78fr_1.22fr]">
          <div className="border-line border-b p-5 sm:p-8 lg:border-r lg:border-b-0">
            <p className="font-mono text-xs tracking-[0.14em] uppercase">
              Supported sources
            </p>
            <p className="text-muted-foreground mt-3 max-w-sm text-sm leading-6">
              One local view across the coding agents you already use.
            </p>
          </div>
          <div className="grid sm:grid-cols-3">
            {sources.map((source, index) => (
              <div
                className="border-line flex min-h-32 flex-col justify-between border-b p-5 last:border-b-0 sm:border-r sm:border-b-0 sm:last:border-r-0"
                key={source.name}
              >
                <span className="text-muted-foreground font-mono text-xs">
                  0{index + 1}
                </span>
                <div>
                  <p className="text-sm font-medium">{source.name}</p>
                  <p className="text-success mt-1 flex items-center gap-1.5 text-xs">
                    <span className="bg-success size-1.5 rounded-full" />
                    {source.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Rail>
      </RailViewport>

      <SectionDivider />

      <RailViewport>
        <Rail
          id="how-it-works"
          className="scroll-mt-20 px-5 py-14 sm:px-8 sm:py-20"
        >
          <SectionHeading
            eyebrow="How it works"
            title="A small utility with a deliberately small data path."
          />
          <div className="border-line mt-10 grid overflow-hidden rounded-xl border md:grid-cols-3">
            {steps.map((step) => (
              <article
                className="border-line min-h-56 border-b p-6 last:border-b-0 md:border-r md:border-b-0 md:last:border-r-0"
                key={step.number}
              >
                <span className="text-ember font-mono text-xs">
                  {step.number}
                </span>
                <h3 className="mt-12 text-base font-medium">{step.title}</h3>
                <p className="text-muted-foreground mt-3 text-sm leading-6">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </Rail>
      </RailViewport>

      <SectionDivider />

      <RailViewport>
        <Rail
          id="privacy"
          className="grid scroll-mt-20 gap-8 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[0.8fr_1.2fr]"
        >
          <SectionHeading
            eyebrow="Privacy"
            title="Usage totals, not your work."
          />
          <div className="border-line bg-surface rounded-xl border p-6 sm:p-8">
            <p className="max-w-xl text-lg leading-8 font-medium text-pretty">
              Lamara is designed to keep prompts, responses, source code, and
              file contents out of collection.
            </p>
            <p className="text-muted-foreground mt-5 max-w-xl text-sm leading-7">
              The desktop app reads supported local usage signals and stores its
              working data on your machine. Future account or sync features must
              remain explicit, optional product work—not silent expansion of
              this local baseline.
            </p>
          </div>
        </Rail>
      </RailViewport>
    </>
  );
}

function ProductPreview() {
  return (
    <section
      aria-label="Lamara tray preview"
      className="border-border bg-surface overflow-hidden rounded-2xl border shadow-[0_24px_80px_-40px_color-mix(in_oklab,var(--foreground)_30%,transparent)]"
    >
      <div className="border-line flex h-11 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <span className="bg-ember size-2 rounded-full" />
          <span className="text-sm font-medium">Today</span>
        </div>
        <span className="text-muted-foreground font-mono text-[11px]">
          updated now
        </span>
      </div>
      <div className="p-5 sm:p-6">
        <p className="text-muted-foreground text-xs">Total usage</p>
        <p className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
          1.84M
          <span className="text-muted-foreground ml-2 text-sm font-normal tracking-normal">
            tokens
          </span>
        </p>
        <div className="mt-6 flex h-2 overflow-hidden rounded-full">
          <div className="bg-foreground w-[58%]" />
          <div className="bg-ember w-[27%]" />
          <div className="bg-muted-foreground/35 w-[15%]" />
        </div>
        <div className="border-line mt-6 grid grid-cols-2 border-t pt-5">
          <Metric label="Estimated cost" value="$12.48" />
          <Metric
            className="border-line border-l pl-5"
            label="Active sources"
            value="3"
          />
        </div>
      </div>
      <div className="diagonal-stripes border-line h-8 border-t" />
    </section>
  );
}

function Metric({
  className,
  label,
  value,
}: {
  className?: string;
  label: string;
  value: string;
}) {
  return (
    <div className={className}>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 font-mono text-sm font-medium">{value}</p>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="max-w-xl">
      <p className="text-ember font-mono text-xs font-medium tracking-[0.14em] uppercase">
        {eyebrow}
      </p>
      <h2 className="mt-4 text-2xl leading-tight font-semibold tracking-[-0.025em] text-balance sm:text-3xl">
        {title}
      </h2>
    </div>
  );
}
