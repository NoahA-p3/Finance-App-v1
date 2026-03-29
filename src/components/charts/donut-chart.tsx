"use client";

import { useMemo, useState } from "react";

export interface DonutDatum {
  name: string;
  amountCents: `${bigint}`;
}

interface DonutChartProps {
  data: DonutDatum[];
  colors: string[];
  className?: string;
  innerRadius?: number;
  outerRadius?: number;
  getValue?: (datum: DonutDatum) => bigint;
  formatValue?: (value: bigint, total: bigint) => string;
}

const SIZE = 240;
const CENTER = SIZE / 2;

function polarToCartesian(radius: number, angle: number) {
  return {
    x: CENTER + radius * Math.cos(angle),
    y: CENTER + radius * Math.sin(angle),
  };
}

export function DonutChart({
  data,
  colors,
  className,
  innerRadius = 58,
  outerRadius = 92,
  getValue = (datum) => BigInt(datum.amountCents),
  formatValue = (value, total) => {
    if (total === 0n) return "0%";
    return `${Number((value * 10000n) / total) / 100}%`;
  }
}: DonutChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const slices = useMemo(() => {
    const total = data.reduce((sum, item) => sum + getValue(item), 0n);
    let start = -Math.PI / 2;

    return data.map((item, index) => {
      const amount = getValue(item);
      const angle = total === 0n ? 0 : (Number((amount * 1_000_000n) / total) / 1_000_000) * Math.PI * 2;
      const end = start + angle;

      const outerStart = polarToCartesian(outerRadius, start);
      const outerEnd = polarToCartesian(outerRadius, end);
      const innerStart = polarToCartesian(innerRadius, end);
      const innerEnd = polarToCartesian(innerRadius, start);
      const largeArc = angle > Math.PI ? 1 : 0;

      const path = [
        `M ${outerStart.x} ${outerStart.y}`,
        `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
        `L ${innerStart.x} ${innerStart.y}`,
        `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerEnd.x} ${innerEnd.y}`,
        "Z",
      ].join(" ");

      const midAngle = start + angle / 2;
      const tooltipPoint = polarToCartesian((innerRadius + outerRadius) / 2, midAngle);

      const slice = {
        item,
        amount,
        total,
        path,
        color: colors[index % colors.length],
        tooltipPoint,
      };

      start = end;
      return slice;
    });
  }, [colors, data, getValue, innerRadius, outerRadius]);

  return (
    <div className={className}>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-full w-full" role="img" aria-label="Donut chart">
        {slices.map((slice, index) => (
          <path
            key={slice.item.name}
            d={slice.path}
            fill={slice.color}
            opacity={activeIndex === null || activeIndex === index ? 1 : 0.6}
            onMouseEnter={() => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
            style={{ transition: "opacity 120ms ease" }}
          >
            <title>{`${slice.item.name}: ${formatValue(slice.amount, slice.total)}`}</title>
          </path>
        ))}
      </svg>

      {activeIndex !== null ? (
        <div className="pointer-events-none -mt-28 ml-2 w-fit rounded-xl border border-white/20 bg-[#171a36] px-3 py-2 text-xs text-indigo-100 shadow-lg">
          <p className="font-medium text-white">{slices[activeIndex].item.name}</p>
          <p>{formatValue(slices[activeIndex].amount, slices[activeIndex].total)}</p>
        </div>
      ) : null}
    </div>
  );
}
