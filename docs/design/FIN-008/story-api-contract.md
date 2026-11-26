Finance API Service, base path /api/finance.

GET /entries/:id — Returns the manual journal entry (status, lines, metadata). Allowed for any authenticated role including auditor. 200 with entry body; 404 if not found; 401 if unauthenticated.

GET /entries/:id/history — Returns the full ordered append-only approval history (submit/approve/reject rows with actor, reason, timestamp) for the entry. Allowed for auditor (and other roles). 200 with history array; 404 if entry not found.

POST /entries — Creates a new draft manual journal entry. Refused for auditor role with 403 Forbidden and body {error:'role_not_permitted', action:'create'}; no entry is persisted. Allowed for preparer/approver roles subject to existing validation.

POST /entries/:id/submit — Transitions a draft entry to submitted. Refused for auditor role with 403 Forbidden and body {error:'role_not_permitted', action:'submit'}; entry status unchanged.

POST /entries/:id/approve — Transitions a submitted entry to approved, appending a history row. Refused for auditor role with 403 Forbidden and body {error:'role_not_permitted', action:'approve'}; entry status unchanged, no history row appended.

POST /entries/:id/reject — Transitions a submitted entry to rejected, appending a history row with a reason. Refused for auditor role with 403 Forbidden and body {error:'role_not_permitted', action:'reject'}; entry status unchanged, no history row appended.

All endpoints require session-resolved caller identity; role resolution happens before policy authorization on every call.
