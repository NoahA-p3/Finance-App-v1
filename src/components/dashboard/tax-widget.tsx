interface TaxWidgetProps {
  revenue: number;
  expenses: number;
  rate?: number;
}

export function TaxWidget({ revenue, expenses, rate = 0.2 }: TaxWidgetProps) {
  const taxableIncome = Math.max(revenue - expenses, 0);
  const estimatedTax = taxableIncome * rate;

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <h3 className="text-lg font-semibold">Estimated Tax</h3>
      <p className="mt-2 text-slate-600">Taxable Income: ${taxableIncome.toFixed(2)}</p>
      <p className="text-2xl font-bold">${estimatedTax.toFixed(2)}</p>
      <p className="text-xs text-slate-500">Using {(rate * 100).toFixed(0)}% default rate. Replace with tax rules later.</p>
    </div>
  );
}
