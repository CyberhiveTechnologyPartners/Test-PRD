POST /api/journal-entries/:id/approve
Auth: session-based; caller resolved via Session/Role Resolver, must hold role `finance-approver`.
Path param: id — journal entry identifier.
Body: none required (optional {comment?: string} for future use, ignored by this story).
Behaviour: Loads the entry; if entry.createdBy === caller.userId, returns 403 Forbidden with body {error: "creator_cannot_approve"} and makes no state change (entry remains status=submitted, no history row appended). Otherwise, if caller holds finance-approver and entry.status === 'submitted', transitions entry to status=approved, appends an insert-only history row {entryId, action:'approve', actorId, timestamp}, and returns 200 OK with the updated entry {id, status, approvedBy, approvedAt}. If entry.status is not 'submitted' (e.g., already approved/rejected), returns 409 Conflict. If entry not found, returns 404.
Also affects GET /api/journal-entries/:id: response now includes entry.createdBy and the resolved caller's userId/roles so the SPA can compute isCreator client-side to hide the Approve control.
