/** Inline note for a section whose data failed to load. */
export function SectionErrorNote({ code }: { code: string }) {
  return (
    <p className="text-muted-foreground text-sm">
      Couldn’t load this section ({code}). Try refreshing the page.
    </p>
  );
}
