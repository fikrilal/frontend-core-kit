import Link from "next/link";

import { LamaraMark } from "@/components/brand/lamara-mark";

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
    <main className="bg-muted/35 flex min-h-svh items-center justify-center px-4 py-12">
      <section
        aria-labelledby="profile-heading"
        className="border-border bg-background w-full max-w-sm rounded-2xl border p-7 shadow-sm"
      >
        <Link
          aria-label="Lamara home"
          className="mb-8 inline-flex items-center gap-2 font-medium"
          href="/"
        >
          <LamaraMark className="size-7" />
          <span className="text-sm">Lamara</span>
        </Link>

        <div className="mb-7 space-y-2">
          <h1
            className="text-2xl font-semibold tracking-tight"
            id="profile-heading"
          >
            Your profile
          </h1>
          <p className="text-muted-foreground text-sm">
            Update how you appear in Lamara.
          </p>
        </div>

        {result.ok ? (
          <>
            {imageUrl ? (
              <div className="mb-6 grid justify-items-center gap-3">
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
            <div className="border-border bg-muted/40 mt-6 rounded-lg border p-4">
              <ProfileImageUploadPlanForm />
            </div>
          </>
        ) : (
          <p className="text-muted-foreground text-sm">
            Your profile is temporarily unavailable. Try again in a moment.
          </p>
        )}
      </section>
    </main>
  );
}
