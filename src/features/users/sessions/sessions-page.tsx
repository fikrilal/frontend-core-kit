import { Badge } from "@/components/ui/badge";
import { AuthShell } from "@/components/layout/auth-shell";

import { loadSessions } from "./load-sessions";
import { RevokeSessionForm } from "./revoke-session-form";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

export async function SessionsPage() {
  const result = await loadSessions();

  return (
    <AuthShell
      description="Devices and browsers signed in to your account."
      headingId="sessions-heading"
      title="Your sessions"
      width="xl"
    >
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
                <Badge className="capitalize" variant="secondary">
                  {session.status}
                </Badge>
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
    </AuthShell>
  );
}

function formatDate(value: string): string {
  return dateFormatter.format(new Date(value));
}
