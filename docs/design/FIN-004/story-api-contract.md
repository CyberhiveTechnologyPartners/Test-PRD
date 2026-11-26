POST /api/finance/entries/{entryId}/approve
Auth: session-resolved caller must hold role financeApprover and must not be the entry's creator (segregation of duties).
Preconditions: entry.status === 'submitted'.
Request body: none.
Responses: 200 {id, status:'approved'} on success; 403 if caller created the entry or lacks the role; 404 if entry not found; 409 if entry.status !== 'submitted'. On success an insert-only row {entryId, action:'approve', actorId, occurredAt} is appended to the history table and the entry's status is updated to 'approved'.

POST /api/finance/entries/{entryId}/reject
Auth: same as approve.
Preconditions: entry.status === 'submitted'.
Request body: {reason: string}.
Validation: reason is required and must have at least 10 non-whitespace characters; otherwise the request is refused and the entry remains unchanged.
Responses: 200 {id, status:'draft'} on success; 400 {error:'reason too short'} if the reason fails validation; 403 if caller created the entry or lacks the role; 404 if entry not found; 409 if entry.status !== 'submitted'. On success the entry's status reverts to 'draft' and an insert-only row {entryId, action:'reject', actorId, reason, occurredAt} is appended to the history table.
