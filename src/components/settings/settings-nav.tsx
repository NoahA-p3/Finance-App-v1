import Link from "next/link";
import { SettingsTabDefinition } from "@/lib/settings/navigation";

interface SettingsNavProps {
  tabs: SettingsTabDefinition[];
  activeTabKey?: string | null;
}

export function SettingsNav({ tabs, activeTabKey }: SettingsNavProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {tabs.map((tab) => {
          const isActive = tab.key === activeTabKey;
          return (
            <Link
              key={tab.key}
              href={tab.href}
              className={`rounded-xl border px-4 py-3 transition ${
                isActive
                  ? "border-cyan-300/60 bg-cyan-400/10"
                  : "border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10"
              }`}
            >
              <p className="text-sm font-semibold text-white">{tab.label}</p>
              <p className="mt-1 text-xs text-indigo-100/75">{tab.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
