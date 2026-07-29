# Initial Public Slice

## Status

The current product slice is one public landing page at `/`.

Implemented:

- concise product positioning;
- product-faithful local usage preview;
- supported-source summary;
- local data-path explanation;
- explicit privacy boundary;
- GitHub source link;
- light and dark themes;
- manifest, robots, sitemap, icon, and social images.

Deferred:

- `/download`;
- `/privacy`;
- `/supported-sources`;
- `/login` and `/register`;
- `/dashboard` and `/reports`;
- release metadata and API integration.

Deferred routes must return 404 until their implementation begins. Navigation
must not link to them.

## Landing-page job

The page must answer:

1. What is Lamara?
2. Which local tools does it support?
3. What information does it expose?
4. What does it intentionally avoid collecting?

Primary message:

> Lamara tracks AI coding-tool usage locally from a lightweight tray app.

The current primary action links to the source repository. A download action is
not shown until release artifacts and installation guidance are implemented.

## Next slice

The next public route should be `/download`, but only after release-source
ownership, supported platforms, artifact selection, and preview/signing caveats
are defined. Authentication is not part of the immediate public foundation.

The current engineering sequence may establish the API contract and
unauthenticated server transport before another product route is added. That
foundation must not introduce speculative public or authenticated routes.
