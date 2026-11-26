# ADR: finance

- Scope: epic finance — FIN-001, FIN-002, FIN-003, FIN-004, FIN-005, FIN-007, FIN-008
- Date: 2026-11-26
- Drafted by: Quy Nguyen

## Context

test

## Decision

The epic adopts **Dedicated finance backend service with append-only history table**.

A real Node REST service owns the finance domain: session roles, segregation-of-duties policy, entry state machine and an insert-only history table in a relational database, with the React SPA reduced to screens calling JSON endpoints over HTTP.

## Reasoning

test

## Consequences

- Turns a frontend-only prototype into a fullstack repo with a server process, schema migrations and dev orchestration, contradicting the signed no-backend, static-fixture decision.
- Needs real user identity and sessions rather than the existing role switcher, so the shell's role model has to change.
- Longest path to a demo: nothing in the finance module renders without the service and database running.

## Alternatives considered

### In-app finance API module over browser storage

A single typed finance API module inside the existing SPA is the only way screens touch ledger state: it returns HTTP-shaped results (including 403 for creator approval and auditor writes), enforces balance, status locking and reason length, and persists entries plus append-only history in localStorage behind new /finance routes in the hand-rolled router.

- The 403 is a simulated status from a function call, not a real HTTP response; all enforcement runs in client code that a user with devtools can bypass.
- State is per browser, so accountant, approver and auditor are role switches in one session rather than genuinely separate users.
- History is append-only only by convention of the module; nothing outside the code prevents a rewrite of the stored JSON.

### Service worker mock HTTP API with IndexedDB ledger

Finance screens call real REST endpoints with fetch; a service worker intercepts them and a handler module applies role, segregation-of-duties, balance and reason rules, returning genuine HTTP 403 and 422 responses over an IndexedDB ledger with an append-only history store.

- Adds a mock-API dependency and service-worker lifecycle to a repo that currently has only react and react-dom, plus a separate node-side handler setup for vitest.
- Enforcement still lives in browser-owned code, so the 403 is honest in shape but not a trust boundary.
- Asynchronous fetch and worker registration make first-paint and test determinism harder than direct function calls.
