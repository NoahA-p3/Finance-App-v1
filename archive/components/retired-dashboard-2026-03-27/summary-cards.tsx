interface SummaryCardsProps {
  revenue: number;
  expenses: number;
  balance: number;
}

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function SummaryCards({ revenue, expenses, balance }: SummaryCardsProps) {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      <article className="rounded-xl bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-500">Revenue</p>
        <p className="text-2xl font-bold text-emerald-600">{usd.format(revenue)}</p>
      </article>
      <article className="rounded-xl bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-500">Expenses</p>
        <p className="text-2xl font-bold text-rose-600">{usd.format(expenses)}</p>
      </article>
      <article className="rounded-xl bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-500">Balance</p>
        <p className="text-2xl font-bold text-slate-900">{usd.format(balance)}</p>
      </article>
    </section>
  );
}
