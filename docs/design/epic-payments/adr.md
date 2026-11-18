# ADR: payments

- Scope: epic payments — PAY-001, PAY-002, PAY-003, PAY-004, PAY-005, PAY-006, PAY-008, PAY-009, PAY-010
- Date: 2026-11-18
- Drafted by: Quy Nguyen

## Context

test

## Decision

The epic adopts **Saved cards module inside the portal application**.

A saved-card module added to the existing portal application and database: the checkout page mounts the Contoso Pay hosted field, and one server-side manager owns listing, cap, ownership and token deletion for both checkout and /account/cards.

## Reasoning

test

## Consequences

- Saved-card data shares the portal database and release cycle, so any card-handling fix ships with the whole portal.
- Token deletion on /account/cards is a synchronous gateway call, so a Contoso Pay outage makes removal fail in front of the customer.
- Cap and ownership rules live in the same process as checkout, so a bug in checkout code can reach the card table directly.

## Alternatives considered

### Dedicated saved cards service behind an internal API

Card tokens move out of the portal into a small saved-cards service with its own database and REST API; the portal application calls it for listing, saving, cap checks and removal, and it is the only component that talks to Contoso Pay about tokens.

- Adds a service and database to deploy, migrate and secure for what is otherwise one table.
- Payment and card save become two calls, so a successful charge with a failed save needs explicit reconciliation or retry.
- Ownership depends on the portal passing a trusted customer identity on every call, making that internal contract security-critical.

### Event-driven token persistence via payment webhook and worker

The portal publishes card save and delete intents to a queue; a card token worker consumes them, applies the cap and ownership rules, writes records only for gateway-confirmed successful payments and retries Contoso Pay token deletions until they stick.

- Saving is eventually consistent, so a card may appear in the list moments after the order confirmation page.
- Requires a queue, a worker and a verified webhook endpoint with idempotency keys, which is new operational surface.
- The cap message shown at checkout is computed from a count that the worker updates later, so concurrent checkouts can briefly disagree.
