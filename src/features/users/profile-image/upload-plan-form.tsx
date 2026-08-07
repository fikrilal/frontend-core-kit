"use client";

import { useActionState, useState } from "react";

import { createProfileImageUploadPlanAction } from "./upload-plan-action";
import type {
  ProfileImageUploadActionState,
  ProfileImageUploadError,
} from "./upload-plan-state";

const initialState: ProfileImageUploadActionState = {
  error: null,
  plan: null,
};

export function ProfileImageUploadPlanForm() {
  const [state, action, pending] = useActionState(
    createProfileImageUploadPlanAction,
    initialState,
  );
  const [file, setFile] = useState<File | null>(null);
  const feedbackId = state.error ? "profile-image-upload-error" : undefined;

  return (
    <form action={action} className="grid gap-3">
      <input name="contentType" type="hidden" value={file?.type ?? ""} />
      <input
        name="sizeBytes"
        type="hidden"
        value={file ? String(file.size) : ""}
      />
      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="profile-image-file">
          Profile image
        </label>
        <input
          accept="image/jpeg,image/png,image/webp"
          aria-describedby={feedbackId}
          aria-invalid={state.error ? true : undefined}
          className="border-border bg-background focus:border-foreground focus-visible:ring-foreground/25 h-10 rounded-lg border px-3 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          id="profile-image-file"
          name="file"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          type="file"
        />
      </div>

      {state.plan ? (
        <p
          aria-live="polite"
          className="text-muted-foreground text-sm"
          id="profile-image-upload-success"
          role="status"
        >
          Upload plan ready. Next, confirm the upload to set your profile image.
        </p>
      ) : null}
      {state.error ? (
        <p
          aria-live="polite"
          className="text-sm text-red-600 dark:text-red-400"
          id="profile-image-upload-error"
        >
          {messageForProfileImageUploadError(state.error)}
        </p>
      ) : null}

      <button
        className="border-border bg-background hover:bg-muted/50 focus-visible:ring-foreground/25 h-10 rounded-lg border px-4 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending || state.plan !== null || file === null}
        type="submit"
      >
        {pending ? "Preparing upload…" : "Prepare upload"}
      </button>
    </form>
  );
}

function messageForProfileImageUploadError(
  error: ProfileImageUploadError,
): string {
  switch (error) {
    case "rateLimited":
      return "Too many upload requests. Please wait and try again.";
    case "conflict":
      return "An upload is already in progress. Refresh and try again.";
    case "invalidInput":
      return "Choose a JPEG, PNG, or WebP image under 5 MB.";
    case "unavailable":
      return "Image upload is temporarily unavailable. Please try again.";
  }
}
