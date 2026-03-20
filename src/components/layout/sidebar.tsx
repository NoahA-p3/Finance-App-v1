import Link from "next/link";

const items = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/transactions", label: "Transactions" }
];

export function Sidebar() {
  return (
    <aside className="hidden w-56 shrink-0 border-r border-slate-200 bg-white p-4 md:block">
      <nav className="space-y-2">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className="block rounded-lg px-3 py-2 hover:bg-slate-100">
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
