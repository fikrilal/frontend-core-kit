"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { motion } from "motion/react";
import type { VariantProps } from "class-variance-authority";
import { CheckIcon, CircleXIcon, CopyIcon } from "lucide-react";

import { IconSwap, IconSwapItem } from "@/components/icon-swap";
import { Button, type buttonVariants } from "@/components/ui/button";
import type { CopyState } from "@/hooks/use-copy-to-clipboard";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { cn } from "@/lib/utils";

type ButtonVariantProps = VariantProps<typeof buttonVariants>;

export interface CopyStateIconProps {
  state: CopyState;
  /** Custom icon for idle state. */
  idleIcon?: ReactNode;
  /** Custom icon for done state. */
  doneIcon?: ReactNode;
  /** Custom icon for error state. */
  errorIcon?: ReactNode;
}

export function CopyStateIcon({
  state,
  idleIcon,
  doneIcon,
  errorIcon,
}: CopyStateIconProps) {
  return (
    <IconSwap>
      <IconSwapItem key={state} as={motion.span}>
        {state === "idle" && (idleIcon ?? <CopyIcon data-slot="idle-icon" />)}

        {state === "done" && (doneIcon ?? <CheckIcon data-slot="done-icon" />)}

        {state === "error" &&
          (errorIcon ?? <CircleXIcon data-slot="error-icon" />)}
      </IconSwapItem>
    </IconSwap>
  );
}

export interface CopyButtonProps
  extends
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">,
    Omit<CopyStateIconProps, "state"> {
  children?: ReactNode;
  size?: ButtonVariantProps["size"];
  variant?: ButtonVariantProps["variant"];
  /** The text to copy, or a function that returns the text. */
  text: string | (() => string);
  /** Called with the copied text on successful copy. */
  onCopySuccess?: (text: string) => void;
  /** Called with the error if the copy operation fails. */
  onCopyError?: (error: Error) => void;
}

export function CopyButton({
  className,
  size = "icon",
  children,
  text,
  idleIcon,
  doneIcon,
  errorIcon,
  onClick,
  onCopySuccess,
  onCopyError,
  ...props
}: CopyButtonProps) {
  const { state, copy } = useCopyToClipboard({
    onCopySuccess,
    onCopyError,
  });

  return (
    <Button
      className={cn("will-change-transform", className)}
      size={size}
      onClick={(e) => {
        void copy(text);
        onClick?.(e);
      }}
      aria-label="Copy"
      {...props}
    >
      <CopyStateIcon
        state={state}
        idleIcon={idleIcon}
        doneIcon={doneIcon}
        errorIcon={errorIcon}
      />
      {children}
    </Button>
  );
}
