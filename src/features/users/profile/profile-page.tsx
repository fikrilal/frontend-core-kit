import { AuthShell } from "@/components/layout/auth-shell";

import { loadAuthenticatedUser } from "../../auth/session/load-authenticated-user";
import { ClearProfileImageForm } from "../profile-image/clear-profile-image-form";
import { loadProfileImageUrl } from "../profile-image/load-profile-image-url";
import { ProfileImageUploadPlanForm } from "../profile-image/upload-plan-form";
import { UpdateProfileForm } from "./update-profile-form";

export async function ProfilePage() {
  const result = await loadAuthenticatedUser();
  const image = result.ok ? await loadProfileImageUrl() : null;
  const imageUrl = image?.ok ? image.imageUrl : null;

  return (
    <AuthShell
      description="Update how you appear in Frontend Core Kit."
      headingId="profile-heading"
      title="Your profile"
    >
      {result.ok ? (
        <>
          {imageUrl ? (
            <div className="grid justify-items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="Your profile"
                className="border-border size-20 rounded-full border object-cover"
                src={imageUrl.url}
              />
              <ClearProfileImageForm />
            </div>
          ) : null}
          <UpdateProfileForm
            displayName={result.user.profile.displayName}
            givenName={result.user.profile.givenName}
            familyName={result.user.profile.familyName}
          />
          <div className="border-border bg-muted/40 rounded-lg border p-4">
            <ProfileImageUploadPlanForm />
          </div>
        </>
      ) : (
        <p className="text-muted-foreground text-sm">
          Your profile is temporarily unavailable. Try again in a moment.
        </p>
      )}
    </AuthShell>
  );
}
