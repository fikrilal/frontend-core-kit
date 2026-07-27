import { cn } from "@/lib/utils";

interface CodeBlockProps {
  children: string;
  className?: string;
}

export function CodeBlock({ children, className }: CodeBlockProps) {
  return (
    <pre
      className={cn(
        "border-border bg-background mt-5 overflow-x-auto rounded-md border p-3 text-xs",
        className,
      )}
    >
      <code>{children}</code>
    </pre>
  );
}
