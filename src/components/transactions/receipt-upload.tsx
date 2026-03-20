"use client";

import { useState } from "react";

export function ReceiptUpload() {
  const [uploading, setUploading] = useState(false);

  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/receipts", {
      method: "POST",
      body: formData
    });

    setUploading(false);
    if (!response.ok) alert("Upload failed");
    else alert("Receipt uploaded");
  };

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <h2 className="mb-2 text-lg font-semibold">Upload Receipt</h2>
      <input type="file" accept="image/*,.pdf" onChange={upload} />
      {uploading && <p className="mt-2 text-sm text-slate-500">Uploading...</p>}
    </div>
  );
}
