/**
 * KpiCards renders summary cards when data is available.
 */
const cards: Array<{ title: string; value: string; gradient: string }> = [];

export default function KpiCards() {
  if (cards.length === 0) {
    return <p className="rounded-2xl bg-[#272B4A] p-5 text-sm text-slate-300">No summary data available yet.</p>;
  }

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <article key={card.title} className={`rounded-2xl bg-gradient-to-br ${card.gradient} p-5 text-white shadow-xl`}>
          <p className="text-sm font-medium text-white/85">{card.title}</p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight">{card.value}</p>
        </article>
      ))}
    </section>
  );
}
