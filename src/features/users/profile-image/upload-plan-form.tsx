"use client";

import { useActionState, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { createProfileImageUploadPlanAction } from "./upload-plan-action";
import { CompleteProfileImageUploadForm } from "./complete-upload-form";
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
    <div className="grid gap-3">
      <form action={action} className="grid gap-3">
        <input name="contentType" type="hidden" value={file?.type ?? ""} />
        <input
          name="sizeBytes"
          type="hidden"
          value={file ? String(file.size) : ""}
        />
        <div className="grid gap-2">
          <Label htmlFor="profile-image-file">Profile image</Label>
          <Input
            accept="image/jpeg,image/png,image/webp"
            aria-describedby={feedbackId}
            aria-invalid={state.error ? true : undefined}
            id="profile-image-file"
            name="file"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            type="file"
          />
        </div>

        {!state.plan ? (
          <>
            {state.error ? (
              <Alert
                aria-live="polite"
                id="profile-image-upload-error"
                variant="destructive"
              >
                <AlertDescription className="text-destructive!">
                  {messageForProfileImageUploadError(state.error)}
                </AlertDescription>
              </Alert>
            ) : null}

            <Button
              disabled={pending || file === null}
              type="submit"
              variant="outline"
            >
              {pending ? "Preparing upload…" : "Prepare upload"}
            </Button>
          </>
        ) : null}
      </form>

      {state.plan ? (
        <div className="grid gap-3">
          <Alert
            aria-live="polite"
            className="bg-muted/35"
            id="profile-image-upload-success"
            role="status"
          >
            <AlertDescription>
              Upload plan ready. Next, confirm the upload to set your profile
              image.
            </AlertDescription>
          </Alert>
          <CompleteProfileImageUploadForm fileId={state.plan.fileId} />
        </div>
      ) : null}
    </div>
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
