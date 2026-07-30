# Session Management

## Current boundary

Lamara uses a backend-for-frontend session:

```text
browser
  -> HttpOnly opaque session cookie
  -> Next.js Server Action / Server Component
  -> process-memory session record
  -> Lamara API access or refresh token
```

The browser never receives API access or refresh tokens. The single Next.js
process stores the tokens, backend user ID, access-token expiry, absolute
session expiry, version, and refresh state.

## Login and logout

`/login` validates email and password in a Server Action, calls the generated
password-login contract, creates a new random web session, and sets
`lamara_session` with `HttpOnly`, `SameSite=Lax`, `Path=/`, and `Secure` in
production.

Logout expires the browser cookie first, removes the in-memory record, and
attempts backend refresh-token revocation. Browser logout remains successful
when the API is unavailable.

## Authenticated reads and refresh

`/app` reads `/v1/me` with `no-store`. A usable access token is reused. An
expiring token or the first eligible `401` initiates one refresh.

Refresh rotation is coordinated per web session:

1. acquire a bounded in-process lock;
2. atomically mark the versioned record as `refreshing`;
3. call the backend once with the current refresh token;
4. atomically replace both tokens and increment the version;
5. let concurrent readers observe the new version.

A definite `429` or `5xx` restores the previous active state and reports
temporary unavailability. A terminal response, network failure, timeout,
invalid response, mismatched user, or abandoned `refreshing` state invalidates
the web session because reuse of a possibly consumed rotating token is unsafe.
`403` is never a refresh trigger.

## Deployment requirements and constraint

- Set `LAMARA_SESSION_TTL_SECONDS` no longer than the backend refresh-token
  lifetime.
- Do not log cookies, authorization headers, request bodies, or tokens.
- Run exactly one Next.js process. Do not add Node.js cluster workers or
  multiple frontend replicas with this session store.

Sessions are intentionally ephemeral: restarting or redeploying the Next.js
process invalidates all frontend sessions. Users must sign in again. This is
the accepted tradeoff for avoiding an external session service while the
deployment remains single-instance.

If horizontal scaling or session continuity across deployments becomes a real
requirement, replace the store through an explicit architecture change. Do not
silently add another frontend replica.
