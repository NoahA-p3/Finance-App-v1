/**
 * KpiCards renders four reusable summary cards for the main financial metrics.
 * Gradient backgrounds are used to match the visual design's accent treatment.
 */
const cards = [
  { title: "Total Balance", value: "$45,820.00", gradient: "from-teal-400 to-blue-500" },
  { title: "Total Income", value: "$12,750.00", gradient: "from-emerald-400 to-cyan-500" },
  { title: "Total Expenses", value: "$8,460.00", gradient: "from-pink-400 to-purple-500" },
  { title: "Total Savings", value: "$4,290.00", gradient: "from-amber-300 to-orange-500" }
];

export default function KpiCards() {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <article
          key={card.title}
          className={`rounded-2xl bg-gradient-to-br ${card.gradient} p-5 text-white shadow-xl`}
        >
          <p className="text-sm font-medium text-white/85">{card.title}</p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight">{card.value}</p>
        </article>
      ))}
    </section>
  );
}
