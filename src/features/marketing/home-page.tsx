import Link from "next/link";

import { Button } from "@/components/ui/button";

export function MarketingHome() {
  return (
    <div className="mx-auto flex min-h-[calc(100svh-7rem)] w-full max-w-2xl items-center px-6 py-16 sm:py-24">
      <section aria-labelledby="hero-title">
        <p className="text-muted-foreground mb-5 font-mono text-xs font-medium tracking-[0.16em] uppercase">
          SaaS foundation
        </p>
        <h1
          id="hero-title"
          className="text-4xl leading-[1.05] font-semibold tracking-[-0.04em] text-balance sm:text-6xl"
        >
          Lamara is taking shape.
        </h1>
        <p className="text-muted-foreground mt-6 max-w-xl text-base leading-7 text-pretty sm:text-lg">
          Lamara is a SaaS product currently under development. Product details
          will be shared when they are ready.
        </p>
        <div className="mt-8">
          <Button asChild>
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
