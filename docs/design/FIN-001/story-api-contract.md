POST /api/finance/journal-entries
Auth: session must resolve to a caller holding the `accountant` role.
Request body: { lines: [{ account: string, lineType: "debit"|"credit", amount: number }, ...] } (at least two lines).
Behaviour: Session/Role Resolver identifies the caller; Segregation of Duties Policy authorises the create call for `accountant`; Journal Entry Service persists the entry and its lines with status `draft` via the Entry Repository. No history row is written at this step.
Response: 201 Created { id, status: "draft", lines, createdBy, createdAt }.
Errors: 401 if caller cannot be identified, 403 if caller lacks the `accountant` role, 422 if lines are missing or malformed.

POST /api/finance/journal-entries/:id/submit
Auth: session must resolve to a caller holding the `accountant` role; policy also checks the caller is permitted to submit this entry (segregation of duties).
Request body: none.
Behaviour: Journal Entry Service loads the entry and lines, computes the debit and credit totals. If the totals are unequal, the submission is refused, the entry's status remains `draft`, and no history row is appended. If the totals are equal, the entry's status is updated to `submitted` in the Entry Repository and an insert-only row is appended to the History Repository recording the submit action, actor and timestamp.
Response: 200 OK { id, status: "submitted" } on success; 409 Conflict { id, status: "draft", reason: "unbalanced" } when debits and credits do not match.
Errors: 401 if caller cannot be identified, 403 if caller lacks the `accountant` role or is blocked by segregation-of-duties policy, 404 if the entry does not exist, 409 as above for unbalanced entries.
