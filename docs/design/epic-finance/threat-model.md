# Threat model — epic finance

- Method: STRIDE
- Option: Dedicated finance backend service with append-only history table
- Drafted by: Design agent

A real Node REST service owns the finance domain: session roles, segregation-of-duties policy, entry state machine and an insert-only history table in a relational database, with the React SPA reduced to screens calling JSON endpoints over HTTP.

## Spoofing

### Session hijacking or token forgery lets an attacker act as another accountant, approver or auditor

Mitigated: Server derives caller identity solely from a signed, httpOnly session validated on every request; no endpoint accepts a client-supplied user id to determine identity or role.

## Tampering

### Direct database access or crafted requests alter submitted entries or history rows outside the state machine

Mitigated: All entry mutations go through the API's state-machine checks only; the API's database role is granted INSERT-only on the history table (no UPDATE/DELETE), enforced at the DB grant level in addition to application logic.

## Repudiation

### An approver or rejecter could deny performing an action if the history row's actor could be influenced by client input

Mitigated: Every history row's acting-user and timestamp are set server-side from the authenticated session at write time, never accepted from the request body.

## Information disclosure

### Insecure direct object reference lets a user read entries or approval history outside their authorised scope by guessing entry IDs

Mitigated: Every read endpoint re-checks the caller's role and entry-level authorisation server-side before returning data, rather than relying on the SPA to only link to permitted entries.

## Denial of service

Not applicable: This is an internal, low-traffic finance tool with authenticated users only; flooding/availability attacks are not a material concern for this story set and are left to standard hosting infrastructure.

## Elevation of privilege

### Creator-approver or auditor-role bypass of the segregation-of-duties and read-only restrictions via direct API calls

Mitigated: Centralised server-side authorisation middleware enforces creator-mismatch on approve/reject and restricts auditor sessions to read endpoints, independent of which UI controls are rendered.
