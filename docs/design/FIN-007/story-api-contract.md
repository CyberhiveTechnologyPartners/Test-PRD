GET /api/entries/{entryId}/history
Auth: requires resolved session with a role permitted to read the entry (creator, approver, or auditor per SoD policy).
Response 200: JSON array of history rows ordered newest first, each { id, entryId, action: 'submit'|'approve'|'reject'|'resubmit', actingUser, actedAt (ISO 8601), reason (nullable) }.
Response 403: caller not authorised to view this entry.
Response 404: entry not found.

PATCH /api/entries/{entryId}/history/{historyId} and DELETE /api/entries/{entryId}/history/{historyId}
Both are rejected unconditionally by the Segregation of Duties Policy before reaching the repository layer: history rows are insert-only and cannot be mutated or removed through the API.
Response 405: Method Not Allowed, body { error: 'approval history is append-only' }.
