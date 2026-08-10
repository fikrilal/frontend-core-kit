"use client";

import { useActionState, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { updateProfileAction } from "./update-profile-action";
import type {
  UpdateProfileActionState,
  UpdateProfileError,
} from "./update-profile-state";

const initialState: UpdateProfileActionState = {
  error: null,
  saved: false,
  profile: null,
};

type UpdateProfileFormProps = Readonly<{
  displayName: string | null | undefined;
  givenName: string | null | undefined;
  familyName: string | null | undefined;
}>;

type ProfileFieldProps = Readonly<{
  autoComplete: string;
  describedBy?: string;
  error?: boolean;
  id: string;
  label: string;
  name: string;
  onChange: (value: string) => void;
  value: string;
}>;

function ProfileField({
  autoComplete,
  describedBy,
  error,
  id,
  label,
  name,
  onChange,
  value,
}: ProfileFieldProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        autoComplete={autoComplete}
        id={id}
        maxLength={100}
        name={name}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </div>
  );
}

const FIELDS: readonly {
  autoComplete: string;
  id: string;
  key: "displayName" | "givenName" | "familyName";
  label: string;
  name: string;
}[] = [
  {
    autoComplete: "name",
    id: "display-name",
    key: "displayName",
    label: "Display name",
    name: "displayName",
  },
  {
    autoComplete: "given-name",
    id: "given-name",
    key: "givenName",
    label: "Given name",
    name: "givenName",
  },
  {
    autoComplete: "family-name",
    id: "family-name",
    key: "familyName",
    label: "Family name",
    name: "familyName",
  },
];

type DraftValues = Readonly<{
  displayName: string;
  givenName: string;
  familyName: string;
}>;

function FieldList({
  describedBy,
  error,
  onFieldChange,
  values,
}: Readonly<{
  describedBy?: string;
  error?: boolean;
  onFieldChange: (key: keyof DraftValues, value: string) => void;
  values: DraftValues;
}>) {
  return FIELDS.map((field) => (
    <ProfileField
      autoComplete={field.autoComplete}
      describedBy={describedBy}
      error={error}
      id={field.id}
      key={field.id}
      label={field.label}
      name={field.name}
      onChange={(value) => onFieldChange(field.key, value)}
      value={values[field.key]}
    />
  ));
}

function useProfileDraft(
  props: UpdateProfileFormProps,
  saved: UpdateProfileActionState["profile"],
) {
  const [draft, setDraft] = useState({
    displayName: props.displayName ?? "",
    givenName: props.givenName ?? "",
    familyName: props.familyName ?? "",
  });
  const values = {
    displayName: saved?.displayName ?? draft.displayName,
    givenName: saved?.givenName ?? draft.givenName,
    familyName: saved?.familyName ?? draft.familyName,
  };
  return { setDraft, values };
}

export function UpdateProfileForm({
  displayName,
  givenName,
  familyName,
}: UpdateProfileFormProps) {
  const [state, action, pending] = useActionState(
    updateProfileAction,
    initialState,
  );
  const hasError = state.error !== null;
  const isSaved = state.saved;
  const feedbackId = hasError
    ? "update-profile-error"
    : isSaved
      ? "update-profile-success"
      : undefined;
  const saved = state.profile;
  const { setDraft, values } = useProfileDraft(
    { displayName, givenName, familyName },
    saved,
  );

  function handleFieldChange(key: keyof DraftValues, value: string) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  return (
    <form action={action} className="grid gap-5">
      <FieldList
        describedBy={feedbackId}
        error={hasError}
        onFieldChange={handleFieldChange}
        values={values}
      />

      {isSaved ? (
        <Alert
          aria-live="polite"
          className="bg-muted/35"
          id="update-profile-success"
          role="status"
        >
          <AlertDescription>Your profile was updated.</AlertDescription>
        </Alert>
      ) : null}
      {state.error ? (
        <Alert
          aria-live="polite"
          id="update-profile-error"
          variant="destructive"
        >
          <AlertDescription className="!text-destructive">
            {messageForUpdateProfileError(state.error)}
          </AlertDescription>
        </Alert>
      ) : null}

      <Button disabled={pending} type="submit">
        {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}

function messageForUpdateProfileError(error: UpdateProfileError): string {
  switch (error) {
    case "invalidInput":
      return "Enter at least one profile field. Each field must be 100 characters or fewer.";
    case "conflict":
      return "Your profile could not be saved. Refresh and try again.";
    case "unavailable":
      return "Saving your profile is temporarily unavailable. Please try again.";
  }
}
