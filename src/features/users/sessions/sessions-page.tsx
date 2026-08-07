import Link from "next/link";

import { LamaraMark } from "@/components/brand/lamara-mark";

import { loadSessions } from "./load-sessions";
import { RevokeSessionForm } from "./revoke-session-form";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

export async function SessionsPage() {
  const result = await loadSessions();

  return (
    <main className="bg-muted/35 flex min-h-svh justify-center px-4 py-12">
      <section
        aria-labelledby="sessions-heading"
        className="border-border bg-background w-full max-w-xl rounded-2xl border p-7 shadow-sm"
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
            id="sessions-heading"
          >
            Your sessions
          </h1>
          <p className="text-muted-foreground text-sm">
            Devices and browsers signed in to your account.
          </p>
        </div>

        {result.ok ? (
          <ul className="grid gap-3">
            {result.sessions.map((session) => (
              <li
                className="border-border bg-muted/40 rounded-lg border p-4"
                key={session.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {session.deviceName ?? "Unknown device"}
                    </p>
                    {session.current ? (
                      <p className="text-muted-foreground text-xs">
                        Current session
                      </p>
                    ) : (
                      <p className="text-muted-foreground text-xs">
                        Last seen {formatDate(session.lastSeenAt)}
                      </p>
                    )}
                  </div>
                  <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs capitalize">
                    {session.status}
                  </span>
                </div>
                {session.current ? null : (
                  <RevokeSessionForm sessionId={session.id} />
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">
            {result.error === "invalidInput"
              ? "Your sessions could not be loaded. Refresh and try again."
              : "Your sessions are temporarily unavailable. Try again in a moment."}
          </p>
        )}
      </section>
    </main>
  );
}

function formatDate(value: string): string {
  return dateFormatter.format(new Date(value));
}
