# Lamara Web API Core Proposal

**Status:** Superseded after foundation implementation

This proposal established the initial direction for Lamara's web API
foundation. Its accepted decisions have been promoted into smaller documents
with explicit ownership:

- [API integration](../engineering/api-integration.md) describes implemented
  behavior and the contract-update workflow.
- [API foundation coverage and roadmap](../engineering/api-foundation-roadmap.md)
  owns missing capabilities and their expected design.
- [Execution plans](../exec-plans/README.md) own implementation sequence,
  decision gates, and verification evidence.

The durable direction remains:

- keep endpoint adapters feature-owned and server-only;
- generate compile-time types and runtime schemas from the committed OpenAPI
  contract;
- keep shared API code limited to transport and protocol behavior;
- keep credentials in a server-side session;
- make caching, timeout, retry, and idempotency explicit;
- add abstractions only after real endpoints prove repeated needs;
- defer reusable core-kit extraction until a second web product demonstrates
  genuine shared code.

This file remains only to preserve historical links from completed execution
plans. Do not use it as an implementation source of truth.
