"use client";

import { useActionState } from "react";

import { clearProfileImageAction } from "./clear-profile-image-action";
import type { ClearProfileImageActionState } from "./clear-profile-image-state";

const initialState: ClearProfileImageActionState = {
  error: null,
  cleared: false,
};

export function ClearProfileImageForm() {
  const [state, action, pending] = useActionState(
    clearProfileImageAction,
    initialState,
  );

  return (
    <form action={action} className="grid gap-3">
      {state.cleared ? (
        <p
          aria-live="polite"
          className="text-muted-foreground text-sm"
          id="clear-profile-image-success"
          role="status"
        >
          Your profile image was removed.
        </p>
      ) : null}
      {state.error ? (
        <p
          aria-live="polite"
          className="text-sm text-red-600 dark:text-red-400"
          id="clear-profile-image-error"
        >
          Removing your profile image is temporarily unavailable. Please try
          again.
        </p>
      ) : null}

      <button
        className="border-border bg-background hover:bg-muted/50 focus-visible:ring-foreground/25 h-10 rounded-lg border px-4 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending || state.cleared}
        type="submit"
      >
        {pending ? "Removing image…" : "Remove profile image"}
      </button>
    </form>
  );
}
