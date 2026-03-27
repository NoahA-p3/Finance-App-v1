/**
 * GoalsPanel shows financial goal cards with progress bars and target amounts.
 * Mock goal progress values are included to match the design prototype state.
 */
const goals = [
  { title: "Emergency Fund", current: "$7,500", target: "$10,000", progress: 75 },
  { title: "Vacation", current: "$2,100", target: "$4,000", progress: 53 },
  { title: "New Car", current: "$9,800", target: "$20,000", progress: 49 }
];

export default function GoalsPanel() {
  return (
    <section className="rounded-2xl bg-[#272B4A] p-5 shadow-lg">
      <h3 className="mb-4 text-lg font-semibold text-slate-100">My Goals</h3>
      <div className="space-y-4">
        {goals.map((goal) => (
          <article key={goal.title} className="rounded-xl bg-slate-800/70 p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-medium text-slate-100">{goal.title}</p>
              <p className="text-xs text-slate-300">{goal.progress}%</p>
            </div>
            <p className="mb-2 text-xs text-slate-300">
              {goal.current} / {goal.target}
            </p>
            <div className="h-2 w-full rounded-full bg-slate-600/80">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
                style={{ width: `${goal.progress}%` }}
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
