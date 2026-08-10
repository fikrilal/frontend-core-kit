"use client";

import { useActionState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

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
        <Alert
          aria-live="polite"
          className="bg-muted/35"
          id="clear-profile-image-success"
          role="status"
        >
          <AlertDescription>Your profile image was removed.</AlertDescription>
        </Alert>
      ) : null}
      {state.error ? (
        <Alert
          aria-live="polite"
          id="clear-profile-image-error"
          variant="destructive"
        >
          <AlertDescription className="!text-destructive">
            Removing your profile image is temporarily unavailable. Please try
            again.
          </AlertDescription>
        </Alert>
      ) : null}

      <Button
        disabled={pending || state.cleared}
        type="submit"
        variant="outline"
      >
        {pending ? "Removing image…" : "Remove profile image"}
      </Button>
    </form>
  );
}
