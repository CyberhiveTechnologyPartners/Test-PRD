# Threat model — epic payments

- Method: STRIDE
- Option: Saved cards module inside the portal application
- Drafted by: Design agent

A saved-card module added to the existing portal application and database: the checkout page mounts the Contoso Pay hosted field, and one server-side manager owns listing, cap, ownership and token deletion for both checkout and /account/cards.

## Spoofing

### An unauthenticated or session-fixated request impersonates a signed-in customer to list, select or pay with that customer's saved cards

Mitigated: Checkout and /account/cards saved-card endpoints require a valid authenticated session bound to the customer, consistent with existing portal authentication

## Tampering

### Checkout request submits a save-card flag or forged client state to bypass the disabled checkbox at the 5-card cap, attempting to write a sixth token row directly

Mitigated: Cap is enforced server-side at the point of storing a token, independent of client checkbox state, so a sixth record is never written regardless of the request sent

## Repudiation

Not applicable: Saved-card store/remove actions are tied to authenticated sessions and existing order/audit records; no new repudiation surface is introduced by colocating the module in the portal

## Information disclosure

### PAN or CVV is captured by a Contoso Portal form field, request log, or error log because the hosted field boundary is not strictly enforced in the shared application code

Mitigated: Card number and CVV inputs are rendered exclusively by the Contoso Pay hosted field; portal servers and logs are verified to never receive or record PAN/CVV via automated checks on requests and log output

## Denial of service

### A Contoso Pay outage causes synchronous token deletion calls from /account/cards to hang or fail, degrading the shared portal application's request handling for unrelated checkout traffic since both run in one process

Accepted: Accepted as a known trade-off of this option; removal failing visibly during a Contoso Pay outage is tolerable and isolated to the removal action rather than the whole portal

## Elevation of privilege

### Customer B references customer A's saved-card identifier to pay or remove a card owned by A, exploiting a missing ownership check in the shared manager

Mitigated: Server-side manager validates that the saved-card identifier belongs to the authenticated customer on every list, pay-with-saved-card and removal request, returning a refusal if not
