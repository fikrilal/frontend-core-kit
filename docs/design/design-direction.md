# Lamara Frontend Design Direction

## Product position

Lamara is a compact, local-first developer utility. The web presence should
feel technical, calm, direct, and trustworthy—not like a generic analytics
SaaS.

The landing page should communicate:

- Lamara lives in the desktop tray;
- it summarizes supported local AI coding-tool usage;
- it exposes tokens, estimated cost, and freshness;
- it is designed not to collect prompts, responses, source code, or file
  contents.

Avoid claims for unimplemented account, sync, report, or download behavior.

## Visual language

The visual and interaction references are:

- `/home/fikrilal/devs/_tmp`
- `/home/fikrilal/devs/personal/code-alchemy`

Reuse their structural language:

- narrow centered rails;
- soft line boundaries;
- compact sticky chrome;
- neutral surfaces;
- restrained type hierarchy;
- sparse motion;
- dense, inspectable product panels.

Lamara’s deliberate difference is a restrained ember accent used for identity
and important signal—not as a full-page theme.

Avoid:

- generic gradients and abstract hero art;
- oversized startup copy;
- fake dashboards unrelated to Lamara;
- decorative motion without product value;
- unsupported calls to action.

## Current composition

```text
Header
Hero + product-faithful tray preview
Supported sources
How the local data path works
Privacy boundary
Footer
```

The next public slice may introduce a download page when actual release
behavior is defined.
