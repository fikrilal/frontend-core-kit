import { Separator } from "@/components/ui/separator";

export function SiteFooter() {
  return (
    <footer className="mx-auto w-full max-w-2xl px-6 py-8">
      <Separator className="mb-6" />
      <p className="text-muted-foreground text-sm">
        Frontend Core Kit is currently under development.
      </p>
    </footer>
  );
}
