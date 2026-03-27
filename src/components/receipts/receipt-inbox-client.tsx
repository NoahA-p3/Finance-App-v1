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

function extractFileName(path: string) {
  const parts = path.split("/");
  return parts[parts.length - 1] ?? path;
}

export function ReceiptInboxClient() {
  const [receipts, setReceipts] = useState<ReceiptRow[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
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

  useEffect(() => {
    void fetchReceipts();
  }, [fetchReceipts]);

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
              </article>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
