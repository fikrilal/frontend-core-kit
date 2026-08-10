"use client";

import { useActionState } from "react";

import { completeProfileImageUploadAction } from "./complete-upload-action";
import type {
  CompleteProfileImageUploadActionState,
  CompleteProfileImageUploadError,
} from "./complete-upload-state";

const initialState: CompleteProfileImageUploadActionState = {
  error: null,
  completed: false,
};

type CompleteProfileImageUploadFormProps = Readonly<{
  fileId: string;
}>;

export function CompleteProfileImageUploadForm({
  fileId,
}: CompleteProfileImageUploadFormProps) {
  const [state, action, pending] = useActionState(
    completeProfileImageUploadAction,
    initialState,
  );

  return (
    <form action={action} className="grid gap-3">
      <input name="fileId" type="hidden" value={fileId} />
      {state.completed ? (
        <p
          aria-live="polite"
          className="text-muted-foreground text-sm"
          id="profile-image-complete-success"
          role="status"
        >
          Your profile image was updated.
        </p>
      ) : null}
      {state.error ? (
        <p
          aria-live="polite"
          className="text-sm text-red-600 dark:text-red-400"
          id="profile-image-complete-error"
        >
          {messageForCompleteProfileImageUploadError(state.error)}
        </p>
      ) : null}

      <button
        className="border-border bg-background hover:bg-muted/50 focus-visible:ring-foreground/25 h-10 rounded-lg border px-4 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending || state.completed}
        type="submit"
      >
        {pending ? "Confirming upload…" : "Confirm upload"}
      </button>
    </form>
  );
}

function messageForCompleteProfileImageUploadError(
  error: CompleteProfileImageUploadError,
): string {
  switch (error) {
    case "notFound":
      return "This upload no longer exists. Start again.";
    case "mismatch":
      return "The uploaded image does not match what was declared. Start again.";
    case "unavailable":
      return "Confirming your image is temporarily unavailable. Please try again.";
  }
}
