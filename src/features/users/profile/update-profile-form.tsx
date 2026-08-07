"use client";

import { useActionState, useState } from "react";

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
      <label className="text-sm font-medium" htmlFor={id}>
        {label}
      </label>
      <input
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        autoComplete={autoComplete}
        className="border-border bg-background focus:border-foreground focus-visible:ring-foreground/25 h-10 rounded-lg border px-3 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
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
        <p
          aria-live="polite"
          className="text-muted-foreground text-sm"
          id="update-profile-success"
          role="status"
        >
          Your profile was updated.
        </p>
      ) : null}
      {state.error ? (
        <p
          aria-live="polite"
          className="text-sm text-red-600 dark:text-red-400"
          id="update-profile-error"
          role="alert"
        >
          {messageForUpdateProfileError(state.error)}
        </p>
      ) : null}

      <button
        aria-describedby={feedbackId}
        className="bg-foreground text-background hover:bg-foreground/90 focus-visible:ring-foreground/25 h-10 rounded-lg px-4 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Saving…" : "Save profile"}
      </button>
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
