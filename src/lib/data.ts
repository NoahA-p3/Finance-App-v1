import { createClient } from "@/lib/supabase/server";

export async function getTransactions(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("transactions")
    .select("id,description,amount,type,date,categories(name),receipts(path)")
    .eq("user_id", userId)
    .order("date", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getSummary(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("amount,type,date")
    .eq("user_id", userId);

  if (error) throw error;

  const revenue = data.filter((t) => t.type === "revenue").reduce((sum, t) => sum + t.amount, 0);
  const expenses = data.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);

  return {
    revenue,
    expenses,
    balance: revenue - expenses,
    points: data.map((t) => ({ date: t.date, revenue: t.type === "revenue" ? t.amount : 0, expenses: t.type === "expense" ? t.amount : 0 }))
  };
}
