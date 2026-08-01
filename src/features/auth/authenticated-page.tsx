import { LamaraMark } from "@/components/brand/lamara-mark";

import { loadAuthenticatedUser } from "./load-authenticated-user";
import { logoutAction } from "./logout-action";

export async function AuthenticatedPage() {
  const result = await loadAuthenticatedUser();

  return (
    <div className="bg-muted/35 min-h-svh">
      <header className="border-border bg-background border-b">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-5">
          <LamaraMark className="size-7" />
          <span className="text-sm font-medium">Lamara</span>
          <div className="flex-1" />
          <form action={logoutAction}>
            <button
              className="text-muted-foreground hover:text-foreground focus-visible:ring-foreground/25 rounded-sm text-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              type="submit"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-12">
        <section className="border-border bg-background max-w-xl rounded-2xl border p-7 shadow-sm">
          <p className="text-muted-foreground mb-3 font-mono text-xs tracking-wider uppercase">
            Authenticated foundation
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {result.ok
              ? "You are signed in."
              : "Lamara is temporarily unavailable."}
          </h1>
          {result.ok ? (
            <>
              <p className="text-muted-foreground mt-3 text-sm">
                {result.user.email}
              </p>
              {!result.user.emailVerified ? (
                <p
                  className="border-border bg-muted/40 text-muted-foreground mt-6 rounded-lg border p-3 text-sm"
                  role="status"
                >
                  Check your inbox to verify your email address. Verification is
                  required before all account features are available.
                </p>
              ) : null}
              <p className="text-muted-foreground mt-8 text-sm">
                Product workflows have not been defined yet.
              </p>
            </>
          ) : (
            <p className="text-muted-foreground mt-3 text-sm">
              Your session is still active. Try again in a moment.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
