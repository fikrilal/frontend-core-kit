import Link from "next/link";

import { Rail, RailViewport } from "@/components/layout/rail";

export function MarketingHome() {
  return (
    <RailViewport>
      <Rail className="flex min-h-[calc(100svh-7rem)] items-center px-5 py-16 sm:px-8 sm:py-24 lg:px-12">
        <section aria-labelledby="hero-title" className="max-w-2xl">
          <p className="text-ember mb-5 font-mono text-xs font-medium tracking-[0.16em] uppercase">
            SaaS foundation
          </p>
          <h1
            id="hero-title"
            className="max-w-xl text-4xl leading-[1.05] font-semibold tracking-[-0.04em] text-balance sm:text-6xl"
          >
            Lamara is taking shape.
          </h1>
          <p className="text-muted-foreground mt-6 max-w-xl text-base leading-7 text-pretty sm:text-lg">
            Lamara is a SaaS product currently under development. Product
            details will be shared when they are ready.
          </p>
          <div className="mt-8">
            <Link
              className="bg-foreground text-background hover:bg-foreground/85 focus-visible:ring-foreground/25 inline-flex h-10 items-center rounded-full px-5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              href="/login"
            >
              Sign in
            </Link>
          </div>
        </section>
      </Rail>
    </RailViewport>
  );
}
