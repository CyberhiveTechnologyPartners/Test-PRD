GET /api/finance/approvals
Auth: requires an authenticated session whose roles include finance-approver, resolved by the Session and Role Resolver and checked by the Segregation of Duties Policy.
Query params: none.
Response 200: { "entries": [ { "id": string, "status": "submitted", "submittedAt": ISO-8601 string, "createdBy": string, "lines": [ { "account": string, "debit": number, "credit": number } ] } ] } ordered by submittedAt ascending; only entries with status exactly 'submitted' are included, all other statuses (draft, posted, rejected, etc.) are excluded.
Response 403: { "error": "forbidden" } when the caller lacks the finance-approver role.
Response 401: { "error": "unauthenticated" } when no valid session is presented.
