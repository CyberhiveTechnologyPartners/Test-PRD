Finance API, JSON over HTTP, session-authenticated.

GET /api/finance/entries/:id
  Auth: any authenticated role (auditor, creator, approver, ...).
  Behaviour: Session and Role Resolver identifies caller roles; SoD Policy permits 'read' for every role including auditor. Returns 200 {entry: JournalEntry, lines: EntryLine[], history: EntryHistory[]} with the entry's full state and its complete insert-only approval history (submit/approve/reject rows). 404 if entry id unknown.

POST /api/finance/entries
  Body: {lines: EntryLine[], memo}
  Behaviour: Policy checks 'create' for caller roles. For role=auditor (and any caller without a role authorised to create), returns 403 {error:'role not permitted'} and no entry row is inserted. Otherwise creates a draft entry and appends no history row (history starts at submit).

POST /api/finance/entries/:id/submit
  Behaviour: Policy checks 'submit'. For role=auditor returns 403, no status change, no history row. Otherwise transitions draft->submitted and appends an insert-only ENTRY_HISTORY row {action:'submit'}.

POST /api/finance/entries/:id/approve
  Body: {reason?}
  Behaviour: Policy checks 'approve', which also enforces segregation of duties (creator cannot approve own entry) in addition to the auditor write-block. For role=auditor returns 403 {error:'role not permitted'}, entry status unchanged, no history row appended. Otherwise transitions submitted->approved and appends {action:'approve'}.

POST /api/finance/entries/:id/reject
  Body: {reason}
  Behaviour: Policy checks 'reject'. For role=auditor returns 403 {error:'role not permitted'}, entry status unchanged, no history row appended. Otherwise transitions submitted->rejected and appends {action:'reject', reason}.

All write endpoints resolve caller roles via the Session and Role Resolver before any repository access, so a denied auditor call never reaches Entry Repository or History Repository.
