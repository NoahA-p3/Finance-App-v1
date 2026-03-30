"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ReceiptRow {
  id: string;
  path: string;
  created_at: string;
  transaction_id: string | null;
}

interface ReceiptListResponse {
  receipts?: ReceiptRow[];
  error?: string;
}

interface TransactionSummary {
  id: string;
  description: string;
  amount: string | number;
  type: "expense" | "revenue";
  date: string;
  receipt_id: string | null;
}

interface ReceiptLinkResponse {
  receipt?: ReceiptRow;
  transaction?: TransactionSummary | null;
  error?: string;
}

function extractFileName(path: string) {
  const parts = path.split("/");
  return parts[parts.length - 1] ?? path;
}

export function ReceiptInboxClient() {
  const [receipts, setReceipts] = useState<ReceiptRow[]>([]);
  const [transactions, setTransactions] = useState<TransactionSummary[]>([]);
  const [selectedTransactionByReceipt, setSelectedTransactionByReceipt] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingReceiptActionId, setPendingReceiptActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchReceipts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/receipts", { method: "GET", cache: "no-store" });
      const payload = (await response.json()) as ReceiptListResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to fetch receipts.");
      }

      setReceipts(payload.receipts ?? []);
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : "Unable to fetch receipts.";
      setError(message);
      setReceipts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    try {
      const response = await fetch("/api/transactions", { method: "GET", cache: "no-store" });
      const payload = (await response.json()) as TransactionSummary[] | { error?: string };

      if (!response.ok || !Array.isArray(payload)) {
        const message = !Array.isArray(payload) && payload.error ? payload.error : "Unable to fetch transactions.";
        throw new Error(message);
      }

      setTransactions(payload);
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : "Unable to fetch transactions.";
      setError(message);
      setTransactions([]);
    }
  }, []);

  useEffect(() => {
    void fetchReceipts();
    void fetchTransactions();
  }, [fetchReceipts, fetchTransactions]);

  useEffect(() => {
    setSelectedTransactionByReceipt((current) => {
      const next: Record<string, string> = {};

      for (const receipt of receipts) {
        next[receipt.id] = current[receipt.id] ?? receipt.transaction_id ?? "";
      }

      return next;
    });
  }, [receipts]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    setSelectedFile(nextFile);
  };

  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile) {
      setError("Please select a receipt file before uploading.");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/receipts", {
        method: "POST",
        body: formData
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to upload receipt.");
      }

      setSelectedFile(null);
      await fetchReceipts();
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : "Unable to upload receipt.";
      setError(message);
    } finally {
      setIsUploading(false);
    }
  };

  const receiptCountLabel = useMemo(() => {
    if (receipts.length === 1) return "1 receipt";
    return `${receipts.length} receipts`;
  }, [receipts.length]);

  const applyLinkMutation = useCallback((payload: ReceiptLinkResponse) => {
    if (!payload.receipt) return;

    setReceipts((current) => current.map((receipt) => (receipt.id === payload.receipt?.id ? payload.receipt : receipt)));

    if (payload.transaction) {
      setTransactions((current) => current.map((transaction) => (transaction.id === payload.transaction?.id ? payload.transaction : transaction)));
    }
  }, []);

  const handleLink = useCallback(
    async (receiptId: string) => {
      const transactionId = selectedTransactionByReceipt[receiptId];

      if (!transactionId) {
        setError("Please select a transaction before linking.");
        return;
      }

      setPendingReceiptActionId(receiptId);
      setError(null);

      try {
        const response = await fetch(`/api/receipts/${receiptId}/link`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transaction_id: transactionId })
        });

        const payload = (await response.json()) as ReceiptLinkResponse;
        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to link receipt.");
        }

        applyLinkMutation(payload);
      } catch (linkError) {
        const message = linkError instanceof Error ? linkError.message : "Unable to link receipt.";
        setError(message);
      } finally {
        setPendingReceiptActionId(null);
      }
    },
    [applyLinkMutation, selectedTransactionByReceipt]
  );

  const handleUnlink = useCallback(
    async (receiptId: string) => {
      setPendingReceiptActionId(receiptId);
      setError(null);

      try {
        const response = await fetch(`/api/receipts/${receiptId}/unlink`, { method: "POST" });
        const payload = (await response.json()) as ReceiptLinkResponse;

        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to unlink receipt.");
        }

        applyLinkMutation(payload);
        setSelectedTransactionByReceipt((current) => ({ ...current, [receiptId]: "" }));
      } catch (unlinkError) {
        const message = unlinkError instanceof Error ? unlinkError.message : "Unable to unlink receipt.";
        setError(message);
      } finally {
        setPendingReceiptActionId(null);
      }
    },
    [applyLinkMutation]
  );

  return (
    <div className="space-y-4">
      <Card>
        <form className="space-y-4" onSubmit={handleUpload}>
          <div className="rounded-2xl border-2 border-dashed border-white/20 bg-[#171a36] p-6 text-center text-sm text-indigo-200/80">
            <p className="font-medium text-white">Upload a new receipt</p>
            <p className="mt-1">Choose an image or PDF to store in your private receipts inbox.</p>
            <input
              className="mx-auto mt-4 block max-w-full text-sm text-indigo-100 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-indigo-100 hover:file:bg-white/20"
              type="file"
              name="file"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-indigo-200/80">{selectedFile ? `Selected file: ${selectedFile.name}` : "No file selected."}</p>
            <Button disabled={!selectedFile || isUploading} type="submit">
              {isUploading ? "Uploading..." : "Upload receipt"}
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Receipt inbox</h2>
          {!isLoading && <p className="text-sm text-indigo-200/75">{receiptCountLabel}</p>}
        </div>

        {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}

        {isLoading ? (
          <p className="py-8 text-center text-sm text-indigo-100/65">Loading persisted receipts...</p>
        ) : receipts.length === 0 ? (
          <p className="py-8 text-center text-sm text-indigo-100/65">No receipts yet. Upload your first receipt to get started.</p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {receipts.map((receipt) => (
              <article key={receipt.id} className="rounded-xl border border-white/10 bg-[#171a36] p-4">
                <p className="truncate font-medium text-white">{extractFileName(receipt.path)}</p>
                <p className="mt-2 text-sm text-indigo-200/70">Added {new Date(receipt.created_at).toLocaleString()}</p>
                <p className="mt-1 text-xs text-indigo-200/70">Receipt ID: {receipt.id}</p>
                <p className="mt-1 text-xs text-cyan-300">
                  {receipt.transaction_id ? `Linked transaction: ${receipt.transaction_id}` : "Not linked to a transaction yet"}
                </p>
                <label className="mt-3 block text-xs text-indigo-100/85">
                  Link to transaction
                  <select
                    className="mt-1 w-full rounded-lg border border-white/15 bg-[#0f1230] px-2 py-2 text-xs text-indigo-100"
                    value={selectedTransactionByReceipt[receipt.id] ?? ""}
                    onChange={(event) =>
                      setSelectedTransactionByReceipt((current) => ({
                        ...current,
                        [receipt.id]: event.target.value
                      }))
                    }
                  >
                    <option value="">Select transaction</option>
                    {transactions.map((transaction) => (
                      <option key={transaction.id} value={transaction.id}>
                        {transaction.date} · {transaction.description}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="mt-3 flex gap-2">
                  <Button
                    type="button"
                    disabled={pendingReceiptActionId === receipt.id || !(selectedTransactionByReceipt[receipt.id] ?? "")}
                    onClick={() => void handleLink(receipt.id)}
                  >
                    {pendingReceiptActionId === receipt.id ? "Saving..." : "Link"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={pendingReceiptActionId === receipt.id || !receipt.transaction_id}
                    onClick={() => void handleUnlink(receipt.id)}
                  >
                    Unlink
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
