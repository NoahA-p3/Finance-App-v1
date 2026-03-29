"use client";

import { useMemo, useState } from "react";

export interface LineSeries<T extends object> {
  key: keyof T;
  label: string;
  color: string;
}

interface LineChartProps<T extends object> {
  data: T[];
  xKey: keyof T;
  series: Array<LineSeries<T>>;
  yTicks?: number;
  className?: string;
  lineWidth?: number;
  gridColor?: string;
  axisColor?: string;
  tickColor?: string;
  getValue: (datum: T, key: keyof T) => bigint;
  formatValue?: (value: bigint) => string;
}

const VIEWBOX_WIDTH = 1000;
const VIEWBOX_HEIGHT = 380;
const PADDING = { top: 24, right: 24, bottom: 44, left: 54 };

export function LineChart<T extends object>({
  data,
  xKey,
  series,
  yTicks = 5,
  className,
  lineWidth = 3,
  gridColor = "rgba(255,255,255,0.12)",
  axisColor = "rgba(183,188,225,0.6)",
  tickColor = "#b7bce1",
  getValue,
  formatValue = (value) => value.toString(),
}: LineChartProps<T>) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const chart = useMemo(() => {
    if (!data.length || !series.length) {
      return null;
    }

    const innerWidth = VIEWBOX_WIDTH - PADDING.left - PADDING.right;
    const innerHeight = VIEWBOX_HEIGHT - PADDING.top - PADDING.bottom;

    const values = data.flatMap((datum) => series.map((item) => getValue(datum, item.key)));
    const maxValue = values.reduce((max, value) => (value > max ? value : max), 0n);
    const minValue = values.reduce((min, value) => (value < min ? value : min), 0n);
    const yMin = minValue < 0n ? minValue : 0n;
    const yMax = maxValue === yMin ? yMin + 1n : maxValue;
    const yRange = yMax - yMin;

    const xFor = (index: number) => PADDING.left + (innerWidth * index) / Math.max(1, data.length - 1);
    const yFor = (value: bigint) => {
      const scaled = Number(((yMax - value) * 1_000_000n) / yRange) / 1_000_000;
      return PADDING.top + scaled * innerHeight;
    };

    const lines = series.map((item) => {
      const points = data.map((datum, index) => ({
        x: xFor(index),
        y: yFor(getValue(datum, item.key)),
        value: getValue(datum, item.key),
      }));

      const path = points
        .map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(2)},${point.y.toFixed(2)}`)
        .join(" ");

      return {
        item,
        path,
        points,
      };
    });

    const yStep = yTicks === 0 ? 1n : yRange / BigInt(yTicks);
    const yAxis = Array.from({ length: yTicks + 1 }).map((_, index) => {
      const value = index === yTicks ? yMax : yMin + yStep * BigInt(index);
      return {
        value,
        y: yFor(value),
      };
    });

    return {
      lines,
      yAxis,
      xFor,
      yFor,
      yMin,
      yMax,
    };
  }, [data, series, yTicks, getValue]);

  if (!chart) {
    return <div className={className} />;
  }

  return (
    <div className={className}>
      <svg viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`} className="h-full w-full" preserveAspectRatio="none" role="img" aria-label="Line chart">
        {chart.yAxis.map((tick) => (
          <g key={tick.value}>
            <line x1={PADDING.left} y1={tick.y} x2={VIEWBOX_WIDTH - PADDING.right} y2={tick.y} stroke={gridColor} strokeDasharray="4 4" />
            <text x={PADDING.left - 8} y={tick.y + 4} textAnchor="end" fill={tickColor} fontSize="12">
              {formatValue(tick.value)}
            </text>
          </g>
        ))}

        <line
          x1={PADDING.left}
          y1={VIEWBOX_HEIGHT - PADDING.bottom}
          x2={VIEWBOX_WIDTH - PADDING.right}
          y2={VIEWBOX_HEIGHT - PADDING.bottom}
          stroke={axisColor}
        />

        {data.map((datum, index) => (
          <text
            key={String((datum as Record<string, unknown>)[xKey as string])}
            x={chart.xFor(index)}
            y={VIEWBOX_HEIGHT - 16}
            textAnchor="middle"
            fill={tickColor}
            fontSize="12"
          >
            {String((datum as Record<string, unknown>)[xKey as string])}
          </text>
        ))}

        {chart.lines.map(({ item, path }) => (
          <path key={String(item.key)} d={path} fill="none" stroke={item.color} strokeWidth={lineWidth} strokeLinejoin="round" strokeLinecap="round" />
        ))}

        {chart.lines.map(({ item, points }) =>
          points.map((point, index) => (
            <circle
              key={`${String(item.key)}-${index}`}
              cx={point.x}
              cy={point.y}
              r={activeIndex === index ? 5 : 0}
              fill={item.color}
              style={{ transition: "r 120ms ease" }}
            />
          ))
        )}

        <rect
          x={PADDING.left}
          y={PADDING.top}
          width={VIEWBOX_WIDTH - PADDING.left - PADDING.right}
          height={VIEWBOX_HEIGHT - PADDING.top - PADDING.bottom}
          fill="transparent"
          onMouseMove={(event) => {
            const bounds = event.currentTarget.getBoundingClientRect();
            const x = event.clientX - bounds.left;
            const ratio = Math.min(Math.max(x / bounds.width, 0), 1);
            const index = Math.round(ratio * Math.max(0, data.length - 1));
            setActiveIndex(index);
          }}
          onMouseLeave={() => setActiveIndex(null)}
        />
      </svg>

      {activeIndex !== null ? (
        <div className="pointer-events-none -mt-28 ml-8 w-fit rounded-xl border border-white/20 bg-[#171a36] px-3 py-2 text-xs text-indigo-100 shadow-lg">
          <p className="font-medium text-white">{String((data[activeIndex] as Record<string, unknown> | undefined)?.[xKey as string] ?? "")}</p>
          {series.map((item) => (
            <p key={String(item.key)} style={{ color: item.color }}>
              {item.label}: {formatValue(getValue(data[activeIndex], item.key))}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
