POST /api/finance/entries/{id}/submit
Auth: session-resolved caller must hold the accountant role and be authorised by the segregation-of-duties policy to act on this entry.
Preconditions: entry.status must be 'draft' and its lines must balance (sum of debits = sum of credits); otherwise responds 409 {error:'NOT_BALANCED'} or {error:'INVALID_STATE'}.
Effect: sets entry.status='submitted', appends a row to entry_history (action='submit', actor_id=caller, occurred_at=now) via the insert-only History Repository. No existing rows are mutated or deleted.
Response: 200 {entry:{id,status:'submitted',...}}.

PATCH /api/finance/entries/{id}/lines/{lineId}
Auth: session-resolved caller authorised by SoD policy to edit this entry (normally the creator while in draft).
Preconditions: entry.status must be 'draft'. If entry.status is 'submitted' (or any non-draft state), the request is refused before any write with 409 {error:'LOCKED_FOR_EDITING'} and the stored entry/lines remain unchanged.
Effect (only when draft): updates the specified line's amount fields and recomputes entry.balanced.
Response: 200 {entry} on success, 409 on lock violation.
