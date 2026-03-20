"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ReceiptPreview({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const supabase = createClient();
      const { data } = await supabase.storage.from("receipts").createSignedUrl(path, 60 * 10);
      setUrl(data?.signedUrl ?? null);
    };
    void run();
  }, [path]);

  if (!url) return <p className="text-xs text-slate-500">Loading preview...</p>;

  return <Image src={url} alt="Receipt preview" width={200} height={200} className="rounded border object-cover" />;
}
