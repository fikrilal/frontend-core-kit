"use client";

import { useActionState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

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
        <Alert
          aria-live="polite"
          className="bg-muted/35"
          id="profile-image-complete-success"
          role="status"
        >
          <AlertDescription>Your profile image was updated.</AlertDescription>
        </Alert>
      ) : null}
      {state.error ? (
        <Alert
          aria-live="polite"
          id="profile-image-complete-error"
          variant="destructive"
        >
          <AlertDescription className="!text-destructive">
            {messageForCompleteProfileImageUploadError(state.error)}
          </AlertDescription>
        </Alert>
      ) : null}

      <Button
        disabled={pending || state.completed}
        type="submit"
        variant="outline"
      >
        {pending ? "Confirming upload…" : "Confirm upload"}
      </Button>
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
