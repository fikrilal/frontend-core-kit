"use client";

// Visual variants aligned with code-alchemy / _tmp shadcn buttons.
// Motion press/hover retained from beui (lamara product preference).

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Slot } from "radix-ui";

import { EASE_OUT, SPRING_PRESS } from "@/lib/ease";
import { useHoverCapable } from "@/lib/hooks/use-hover-capable";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        outline:
          "border-border bg-background text-foreground hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-10 gap-2 px-4 text-xs has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-[min(var(--radius-md),12px)] px-3 text-xs has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-2 px-5 text-sm has-data-[icon=inline-end]:pr-3.5 has-data-[icon=inline-start]:pl-3.5",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7 rounded-[min(var(--radius-md),12px)]",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

interface ButtonProps
  extends React.ComponentProps<"button">, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** Scale applied while pressed. beui default is 0.93. */
  pressScale?: number;
  /** Material-style ripple from the press point. Off by default. */
  ripple?: boolean;
}

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  pressScale = 0.93,
  ripple = false,
  children,
  onPointerDown,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  const reduce = useReducedMotion();
  const canHover = useHoverCapable();
  const [ripples, setRipples] = React.useState<Ripple[]>([]);
  const nextId = React.useRef(0);

  const handlePointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (ripple && !reduce && !disabled) {
        const rect = event.currentTarget.getBoundingClientRect();
        const rippleSize = Math.max(rect.width, rect.height) * 2;
        setRipples((prev) => [
          ...prev,
          {
            id: nextId.current++,
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
            size: rippleSize,
          },
        ]);
      }
      onPointerDown?.(event);
    },
    [ripple, reduce, disabled, onPointerDown],
  );

  const classes = cn(
    buttonVariants({ variant, size, className }),
    ripple && "relative overflow-hidden",
  );

  if (asChild && React.isValidElement(children)) {
    return (
      <Slot.Root
        data-slot="button"
        data-variant={variant}
        data-size={size}
        className={cn(
          classes,
          !reduce &&
            "origin-center transition-transform duration-150 ease-out active:scale-[0.93]",
          !reduce && canHover && "hover:scale-[1.02]",
        )}
        {...props}
      >
        {children}
      </Slot.Root>
    );
  }

  const motionProps = props as unknown as Omit<
    React.ComponentProps<typeof motion.button>,
    "children" | "ref" | "type" | "disabled" | "className" | "onPointerDown"
  >;

  return (
    <motion.button
      data-slot="button"
      data-variant={variant}
      data-size={size}
      type={type}
      disabled={disabled}
      whileTap={reduce || disabled ? undefined : { scale: pressScale }}
      whileHover={reduce || disabled || !canHover ? undefined : { scale: 1.02 }}
      transition={SPRING_PRESS}
      onPointerDown={handlePointerDown}
      className={classes}
      {...motionProps}
    >
      {ripple && !reduce ? (
        <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
          <AnimatePresence>
            {ripples.map((r) => (
              <motion.span
                key={r.id}
                className="absolute rounded-full bg-current"
                style={{
                  left: r.x,
                  top: r.y,
                  width: r.size,
                  height: r.size,
                  x: "-50%",
                  y: "-50%",
                }}
                initial={{ scale: 0, opacity: 0.3 }}
                animate={{ scale: 1, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.6, ease: EASE_OUT }}
                onAnimationComplete={() =>
                  setRipples((prev) => prev.filter((x) => x.id !== r.id))
                }
              />
            ))}
          </AnimatePresence>
        </span>
      ) : null}
      {children}
    </motion.button>
  );
}

export { Button, buttonVariants };
export type { ButtonProps };
