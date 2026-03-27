
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface PostTransactionInput {
  transactionId: string;
}

interface ReversePostingInput {
  postingId: string;
  reason: string;
}

interface CreatePeriodLockInput {
  startDate: string;
  endDate: string;
  reason?: string | null;
}

function isIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function assertUuid(value: string, fieldName: string) {
  if (!UUID_PATTERN.test(value)) {
    throw new Error(`${fieldName} must be a valid UUID.`);
  }
}

async function assertNoPeriodLock(
  supabase: any,
  companyId: string,
  postingDate: string
) {
  const { data, error } = await supabase
    .from("period_locks")
    .select("id")
    .eq("company_id", companyId)
    .lte("start_date", postingDate)
    .gte("end_date", postingDate)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (data) {
    throw new Error(`Posting date ${postingDate} is inside a locked accounting period.`);
  }
}

async function insertAuditEvent(
  supabase: any,
  companyId: string,
  userId: string,
  entityTable: string,
  entityId: string,
  eventType: string,
  metadata: Record<string, unknown>
) {
  const { error } = await supabase.from("audit_events").insert({
    company_id: companyId,
    actor_user_id: userId,
    entity_table: entityTable,
    entity_id: entityId,
    event_type: eventType,
    metadata
  });

  if (error) {
    throw new Error(error.message);
  }
}

function deriveLineAccounts(transactionType: "expense" | "revenue") {
  if (transactionType === "expense") {
    return { debitAccountCode: "operating_expense", creditAccountCode: "cash" };
  }

  return { debitAccountCode: "cash", creditAccountCode: "operating_revenue" };
}

export async function createPostingForTransaction(
  supabase: any,
  userId: string,
  companyId: string,
  input: PostTransactionInput
) {
  assertUuid(input.transactionId, "transactionId");

  const { data: existingJournal } = await supabase
    .from("journal_entries")
    .select("id")
    .eq("company_id", companyId)
    .eq("source_transaction_id", input.transactionId)
    .in("status", ["posted", "reversed"])
    .maybeSingle();

  if (existingJournal) {
    throw new Error("Transaction already has a posted journal entry. Use reversal or adjustment posting.");
  }

  const { data: transaction, error: transactionError } = await supabase
    .from("transactions")
    .select("id, amount, date, type, description")
    .eq("id", input.transactionId)
    .eq("company_id", companyId)
    .maybeSingle();

  if (transactionError) throw new Error(transactionError.message);
  if (!transaction) throw new Error("Transaction not found in active company context.");

  await assertNoPeriodLock(supabase, companyId, transaction.date);

  const { debitAccountCode, creditAccountCode } = deriveLineAccounts(transaction.type);

  const { data: journalEntry, error: entryError } = await supabase
    .from("journal_entries")
    .insert({
      company_id: companyId,
      source_transaction_id: transaction.id,
      status: "posted",
      posting_date: transaction.date,
      description: transaction.description,
      posted_at: new Date().toISOString(),
      posted_by: userId
    })
    .select("id, status, posting_date, source_transaction_id")
    .single();

  if (entryError) throw new Error(entryError.message);

  const { error: linesError } = await supabase.from("journal_lines").insert([
    {
      journal_entry_id: journalEntry.id,
      company_id: companyId,
      line_no: 1,
      account_code: debitAccountCode,
      direction: "debit",
      amount: transaction.amount,
      description: transaction.description
    },
    {
      journal_entry_id: journalEntry.id,
      company_id: companyId,
      line_no: 2,
      account_code: creditAccountCode,
      direction: "credit",
      amount: transaction.amount,
      description: transaction.description
    }
  ]);

  if (linesError) throw new Error(linesError.message);

  await insertAuditEvent(supabase, companyId, userId, "journal_entries", journalEntry.id, "posting.posted", {
    source_transaction_id: transaction.id,
    posting_date: transaction.date,
    amount: transaction.amount,
    transaction_type: transaction.type
  });

  return journalEntry;
}

export async function reversePosting(
  supabase: any,
  userId: string,
  companyId: string,
  input: ReversePostingInput
) {
  assertUuid(input.postingId, "postingId");

  const reason = input.reason.trim();
  if (!reason) {
    throw new Error("Reversal reason is required.");
  }

  const { data: sourceEntry, error: sourceError } = await supabase
    .from("journal_entries")
    .select("id, company_id, posting_date, description, status, source_transaction_id")
    .eq("id", input.postingId)
    .eq("company_id", companyId)
    .maybeSingle();

  if (sourceError) throw new Error(sourceError.message);
  if (!sourceEntry) throw new Error("Posting not found in active company context.");
  if (sourceEntry.status !== "posted") throw new Error("Only posted entries can be reversed.");

  const { data: priorReversal } = await supabase
    .from("journal_entries")
    .select("id")
    .eq("company_id", companyId)
    .eq("reversal_of_journal_entry_id", sourceEntry.id)
    .maybeSingle();

  if (priorReversal) {
    throw new Error("Posting already has a reversal entry.");
  }

  await assertNoPeriodLock(supabase, companyId, sourceEntry.posting_date);

  const { data: sourceLines, error: linesError } = await supabase
    .from("journal_lines")
    .select("line_no, account_code, direction, amount, description")
    .eq("journal_entry_id", sourceEntry.id)
    .eq("company_id", companyId)
    .order("line_no", { ascending: true });

  if (linesError) throw new Error(linesError.message);
  if (!sourceLines || sourceLines.length === 0) {
    throw new Error("Posting has no journal lines to reverse.");
  }

  const nowIso = new Date().toISOString();

  const { data: reversalEntry, error: reversalEntryError } = await supabase
    .from("journal_entries")
    .insert({
      company_id: companyId,
      source_transaction_id: sourceEntry.source_transaction_id,
      reversal_of_journal_entry_id: sourceEntry.id,
      status: "posted",
      posting_date: sourceEntry.posting_date,
      description: `Reversal: ${sourceEntry.description}`,
      posted_at: nowIso,
      posted_by: userId
    })
    .select("id, reversal_of_journal_entry_id, status, posting_date")
    .single();

  if (reversalEntryError) throw new Error(reversalEntryError.message);

  const reversedLines = sourceLines.map((line: any) => ({
    journal_entry_id: reversalEntry.id,
    company_id: companyId,
    line_no: line.line_no,
    account_code: line.account_code,
    direction: line.direction === "debit" ? "credit" : "debit",
    amount: line.amount,
    description: `Reversal line: ${line.description ?? ""}`.trim()
  }));

  const { error: insertReversalLinesError } = await supabase.from("journal_lines").insert(reversedLines);
  if (insertReversalLinesError) throw new Error(insertReversalLinesError.message);

  const { error: markSourceReversedError } = await supabase
    .from("journal_entries")
    .update({
      status: "reversed",
      reversed_at: nowIso,
      reversed_by: userId,
      reversal_reason: reason
    })
    .eq("id", sourceEntry.id)
    .eq("company_id", companyId)
    .eq("status", "posted");

  if (markSourceReversedError) throw new Error(markSourceReversedError.message);

  await insertAuditEvent(supabase, companyId, userId, "journal_entries", sourceEntry.id, "posting.reversed", {
    reversal_entry_id: reversalEntry.id,
    reason
  });

  return {
    source_entry_id: sourceEntry.id,
    reversal_entry_id: reversalEntry.id,
    status: "reversed"
  };
}

export async function listPostings(supabase: any, companyId: string) {
  const { data, error } = await supabase
    .from("journal_entries")
    .select("id, source_transaction_id, reversal_of_journal_entry_id, status, posting_date, description, posted_at, reversed_at")
    .eq("company_id", companyId)
    .order("posting_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function createPeriodLock(
  supabase: any,
  userId: string,
  companyId: string,
  input: CreatePeriodLockInput
) {
  if (!isIsoDate(input.startDate) || !isIsoDate(input.endDate)) {
    throw new Error("start_date and end_date must use YYYY-MM-DD format.");
  }

  if (input.startDate > input.endDate) {
    throw new Error("start_date must be before or equal to end_date.");
  }

  const reason = input.reason?.trim() || null;

  const { data, error } = await supabase
    .from("period_locks")
    .insert({
      company_id: companyId,
      start_date: input.startDate,
      end_date: input.endDate,
      reason,
      locked_by: userId
    })
    .select("id, start_date, end_date, reason, locked_at, locked_by")
    .single();

  if (error) throw new Error(error.message);

  await insertAuditEvent(supabase, companyId, userId, "period_locks", data.id, "period.locked", {
    start_date: data.start_date,
    end_date: data.end_date,
    reason: data.reason
  });

  return data;
}

export async function listPeriodLocks(supabase: any, companyId: string) {
  const { data, error } = await supabase
    .from("period_locks")
    .select("id, start_date, end_date, reason, locked_at, locked_by")
    .eq("company_id", companyId)
    .order("start_date", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}
