import type { ReactNode } from "react";

import { Rail, RailViewport } from "@/components/layout/rail";
import { cn } from "@/lib/cn";

const techStack = [
  "Tauri",
  "Rust",
  "Next.js",
  "React",
  "Tailwind CSS",
  "SQLite",
  "TypeScript",
] as const;

export function SiteCredits() {
  return (
    <RailViewport>
      <Rail className="px-2">
        <section
          aria-labelledby="site-credits-title"
          className="py-10 sm:py-12"
        >
          <h2 id="site-credits-title" className="sr-only">
            Site credits
          </h2>

          <dl className="mx-auto grid w-full max-w-md gap-4 font-mono text-sm leading-6 md:max-w-xl">
            <CreditItem label="Crafted by">
              <a
                className="hover:underline"
                href="https://github.com/fikrilal"
                rel="noopener noreferrer"
                target="_blank"
              >
                fikrilal
              </a>
            </CreditItem>

            <CreditItem label="Contributor">
              <a
                className="hover:underline"
                href="https://github.com/Greek-Cp"
                rel="noopener noreferrer"
                target="_blank"
              >
                Greek-Cp
              </a>
            </CreditItem>

            <CreditItem label="Tech stack">
              <ul className="flex flex-col gap-2">
                {techStack.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </CreditItem>

            <CreditItem label="Deployed on">Vercel</CreditItem>

            <CreditItem label="Source code">
              <a
                className="hover:underline"
                href="https://github.com/fikrilal/lamara"
                rel="noopener noreferrer"
                target="_blank"
              >
                GitHub
              </a>
            </CreditItem>

            <CreditItem label="License">
              <a
                className="hover:underline"
                href="https://github.com/fikrilal/lamara/blob/main/LICENSE"
                rel="noopener noreferrer"
                target="_blank"
              >
                MIT License
              </a>
            </CreditItem>
          </dl>
        </section>
      </Rail>
    </RailViewport>
  );
}

function CreditItem({
  children,
  className,
  label,
}: {
  children: ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <div className={cn("grid grid-cols-2 gap-4", className)}>
      <dt className="text-muted-foreground text-right">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
