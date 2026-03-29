
import { deriveLineAccounts } from "@/lib/postings/account-mapping";
import type { Database } from "@/types/database";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type DbError = { message: string };
type QueryResult<T> = Promise<{ data: T; error: DbError | null }>;

interface PostingsQueryBuilder<TData = unknown> extends PromiseLike<unknown> {
  select(columns: string): PostingsQueryBuilder<TData>;
  eq(column: string, value: unknown): PostingsQueryBuilder<TData>;
  lte(column: string, value: unknown): PostingsQueryBuilder<TData>;
  gte(column: string, value: unknown): PostingsQueryBuilder<TData>;
  in(column: string, values: readonly string[]): PostingsQueryBuilder<TData>;
  limit(count: number): PostingsQueryBuilder<TData>;
  maybeSingle(): QueryResult<TData | null>;
  single(): QueryResult<TData>;
  insert(values: unknown): PostingsQueryBuilder<TData>;
  update(values: unknown): PostingsQueryBuilder<TData>;
  order(column: string, options?: { ascending?: boolean }): PostingsQueryBuilder<TData>;
}

interface PostingSupabaseClient {
  from(table: keyof Database["public"]["Tables"] | string): unknown;
}

type JournalLineInsert = Database["public"]["Tables"]["journal_lines"]["Insert"];
type PeriodLockRow = Database["public"]["Tables"]["period_locks"]["Row"];
type TransactionRow = Database["public"]["Tables"]["transactions"]["Row"];
type JournalEntryRow = Database["public"]["Tables"]["journal_entries"]["Row"];
type AuditEventInsert = Database["public"]["Tables"]["audit_events"]["Insert"];

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
  supabase: PostingSupabaseClient,
  companyId: string,
  postingDate: string
) {
  const { data, error } = (await (supabase.from("period_locks") as PostingsQueryBuilder)
    .select("id")
    .eq("company_id", companyId)
    .lte("start_date", postingDate)
    .gte("end_date", postingDate)
    .limit(1)
    .maybeSingle()) as { data: Pick<PeriodLockRow, "id"> | null; error: DbError | null };

  if (error) {
    throw new Error(error.message);
  }

  if (data) {
    throw new Error(`Posting date ${postingDate} is inside a locked accounting period.`);
  }
}

async function insertAuditEvent(
  supabase: PostingSupabaseClient,
  companyId: string,
  userId: string,
  entityTable: string,
  entityId: string,
  eventType: string,
  metadata: Record<string, unknown>
) {
  const payload: AuditEventInsert = {
    company_id: companyId,
    actor_user_id: userId,
    entity_table: entityTable,
    entity_id: entityId,
    event_type: eventType,
    metadata: metadata as Database["public"]["Tables"]["audit_events"]["Insert"]["metadata"]
  };

  const { error } = (await (supabase.from("audit_events") as PostingsQueryBuilder).insert(payload)) as {
    data: null;
    error: DbError | null;
  };

  if (error) {
    throw new Error(error.message);
  }
}

export async function createPostingForTransaction(
  supabase: PostingSupabaseClient,
  userId: string,
  companyId: string,
  input: PostTransactionInput
) {
  assertUuid(input.transactionId, "transactionId");

  const { data: existingJournal } = (await (supabase.from("journal_entries") as PostingsQueryBuilder)
    .select("id")
    .eq("company_id", companyId)
    .eq("source_transaction_id", input.transactionId)
    .in("status", ["posted", "reversed"])
    .maybeSingle()) as { data: Pick<JournalEntryRow, "id"> | null; error: DbError | null };

  if (existingJournal) {
    throw new Error("Transaction already has a posted journal entry. Use reversal or adjustment posting.");
  }

  const { data: transaction, error: transactionError } = (await (supabase.from("transactions") as PostingsQueryBuilder)
    .select("id, amount, date, type, description")
    .eq("id", input.transactionId)
    .eq("company_id", companyId)
    .maybeSingle()) as { data: Pick<TransactionRow, "id" | "amount" | "date" | "type" | "description"> | null; error: DbError | null };

  if (transactionError) throw new Error(transactionError.message);
  if (!transaction) throw new Error("Transaction not found in active company context.");

  await assertNoPeriodLock(supabase, companyId, transaction.date);

  const { debitAccountCode, creditAccountCode } = deriveLineAccounts(transaction.type);

  const { data: journalEntry, error: entryError } = (await (supabase.from("journal_entries") as PostingsQueryBuilder)
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
    .single()) as {
    data: Pick<JournalEntryRow, "id" | "status" | "posting_date" | "source_transaction_id">;
    error: DbError | null;
  };

  if (entryError) throw new Error(entryError.message);

  const { error: linesError } = (await (supabase.from("journal_lines") as PostingsQueryBuilder).insert([
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
  ])) as { data: null; error: DbError | null };

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
  supabase: PostingSupabaseClient,
  userId: string,
  companyId: string,
  input: ReversePostingInput
) {
  assertUuid(input.postingId, "postingId");

  const reason = input.reason.trim();
  if (!reason) {
    throw new Error("Reversal reason is required.");
  }

  const { data: sourceEntry, error: sourceError } = (await (supabase.from("journal_entries") as PostingsQueryBuilder)
    .select("id, company_id, posting_date, description, status, source_transaction_id")
    .eq("id", input.postingId)
    .eq("company_id", companyId)
    .maybeSingle()) as {
    data: Pick<JournalEntryRow, "id" | "company_id" | "posting_date" | "description" | "status" | "source_transaction_id"> | null;
    error: DbError | null;
  };

  if (sourceError) throw new Error(sourceError.message);
  if (!sourceEntry) throw new Error("Posting not found in active company context.");
  if (sourceEntry.status !== "posted") throw new Error("Only posted entries can be reversed.");

  const { data: priorReversal } = (await (supabase.from("journal_entries") as PostingsQueryBuilder)
    .select("id")
    .eq("company_id", companyId)
    .eq("reversal_of_journal_entry_id", sourceEntry.id)
    .maybeSingle()) as { data: Pick<JournalEntryRow, "id"> | null; error: DbError | null };

  if (priorReversal) {
    throw new Error("Posting already has a reversal entry.");
  }

  await assertNoPeriodLock(supabase, companyId, sourceEntry.posting_date);

  const { data: sourceLines, error: linesError } = (await (supabase.from("journal_lines") as PostingsQueryBuilder)
    .select("line_no, account_code, direction, amount, description")
    .eq("journal_entry_id", sourceEntry.id)
    .eq("company_id", companyId)
    .order("line_no", { ascending: true })) as {
    data: Pick<Database["public"]["Tables"]["journal_lines"]["Row"], "line_no" | "account_code" | "direction" | "amount" | "description">[] | null;
    error: DbError | null;
  };

  if (linesError) throw new Error(linesError.message);
  if (!sourceLines || sourceLines.length === 0) {
    throw new Error("Posting has no journal lines to reverse.");
  }

  const nowIso = new Date().toISOString();

  const { data: reversalEntry, error: reversalEntryError } = (await (supabase.from("journal_entries") as PostingsQueryBuilder)
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
    .single()) as {
    data: Pick<JournalEntryRow, "id" | "reversal_of_journal_entry_id" | "status" | "posting_date">;
    error: DbError | null;
  };

  if (reversalEntryError) throw new Error(reversalEntryError.message);

  const reversedLines: JournalLineInsert[] = sourceLines.map((line) => ({
    journal_entry_id: reversalEntry.id,
    company_id: companyId,
    line_no: line.line_no,
    account_code: line.account_code,
    direction: line.direction === "debit" ? "credit" : "debit",
    amount: line.amount,
    description: `Reversal line: ${line.description ?? ""}`.trim()
  }));

  const { error: insertReversalLinesError } = (await (supabase.from("journal_lines") as PostingsQueryBuilder).insert(reversedLines)) as {
    data: null;
    error: DbError | null;
  };
  if (insertReversalLinesError) throw new Error(insertReversalLinesError.message);

  const { error: markSourceReversedError } = (await (supabase.from("journal_entries") as PostingsQueryBuilder)
    .update({
      status: "reversed",
      reversed_at: nowIso,
      reversed_by: userId,
      reversal_reason: reason
    })
    .eq("id", sourceEntry.id)
    .eq("company_id", companyId)
    .eq("status", "posted")) as { data: null; error: DbError | null };

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

export async function listPostings(supabase: PostingSupabaseClient, companyId: string) {
  const { data, error } = (await (supabase.from("journal_entries") as PostingsQueryBuilder)
    .select("id, source_transaction_id, reversal_of_journal_entry_id, status, posting_date, description, posted_at, reversed_at")
    .eq("company_id", companyId)
    .order("posting_date", { ascending: false })
    .order("created_at", { ascending: false })) as {
    data: Pick<
      JournalEntryRow,
      "id" | "source_transaction_id" | "reversal_of_journal_entry_id" | "status" | "posting_date" | "description" | "posted_at" | "reversed_at"
    >[];
    error: DbError | null;
  };

  if (error) throw new Error(error.message);
  return data;
}

export async function createPeriodLock(
  supabase: PostingSupabaseClient,
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

  const { data, error } = (await (supabase.from("period_locks") as PostingsQueryBuilder)
    .insert({
      company_id: companyId,
      start_date: input.startDate,
      end_date: input.endDate,
      reason,
      locked_by: userId
    })
    .select("id, start_date, end_date, reason, locked_at, locked_by")
    .single()) as {
    data: Pick<PeriodLockRow, "id" | "start_date" | "end_date" | "reason" | "locked_at" | "locked_by">;
    error: DbError | null;
  };

  if (error) throw new Error(error.message);

  await insertAuditEvent(supabase, companyId, userId, "period_locks", data.id, "period.locked", {
    start_date: data.start_date,
    end_date: data.end_date,
    reason: data.reason
  });

  return data;
}

export async function listPeriodLocks(supabase: PostingSupabaseClient, companyId: string) {
  const { data, error } = (await (supabase.from("period_locks") as PostingsQueryBuilder)
    .select("id, start_date, end_date, reason, locked_at, locked_by")
    .eq("company_id", companyId)
    .order("start_date", { ascending: false })) as {
    data: Pick<PeriodLockRow, "id" | "start_date" | "end_date" | "reason" | "locked_at" | "locked_by">[];
    error: DbError | null;
  };

  if (error) throw new Error(error.message);
  return data;
}
