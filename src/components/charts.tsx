"use client";

import { useId, useMemo, useState } from "react";
import type { Locale } from "@/lib/format";
import { formatShortDate } from "@/lib/format";
import { cn } from "@/components/ui";

type Point = { day: string; value: number };

function money(locale: Locale, value: number) {
  return new Intl.NumberFormat(locale === "ru" ? "ru-RU" : "en-US", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);
}

function plain(locale: Locale, value: number) {
  return new Intl.NumberFormat(locale === "ru" ? "ru-RU" : "en-US").format(value);
}

const W = 640;
const H = 210;
const PAD = { top: 16, right: 10, bottom: 26, left: 10 };

/** Catmull-Rom → cubic bezier, keeps the line smooth without a chart library. */
function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length < 3) {
    return points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  }
  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return d;
}

export function AreaChart({
  data,
  locale,
  format = "number",
  color = "#2AABEE",
  height = 220,
}: {
  data: Point[];
  locale: Locale;
  format?: "money" | "number";
  color?: string;
  height?: number;
}) {
  const gradientId = useId().replace(/:/g, "");
  const [hover, setHover] = useState<number | null>(null);

  const { points, max, linePath, areaPath, labels } = useMemo(() => {
    const values = data.map((d) => d.value);
    const max = Math.max(1, ...values) * 1.12;
    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;
    const pts = data.map((d, i) => ({
      x: PAD.left + (data.length === 1 ? innerW / 2 : (i * innerW) / (data.length - 1)),
      y: PAD.top + (1 - d.value / max) * innerH,
    }));
    const linePath = smoothPath(pts);
    const areaPath =
      pts.length > 0
        ? `${linePath} L${pts[pts.length - 1].x},${H - PAD.bottom} L${pts[0].x},${H - PAD.bottom} Z`
        : "";
    const tickIdx = [0, Math.floor((data.length - 1) / 3), Math.floor(((data.length - 1) * 2) / 3), data.length - 1];
    const labels = tickIdx
      .filter((v, i, arr) => arr.indexOf(v) === i && data[v])
      .map((i) => ({
        x: pts[i].x,
        text: formatShortDate(locale, new Date(`${data[i].day}T12:00:00`)),
      }));
    return { points: pts, max, linePath, areaPath, labels };
  }, [data, locale]);

  const fmt = format === "money" ? (v: number) => money(locale, v) : (v: number) => plain(locale, v);
  const active = hover !== null ? data[hover] : null;
  const activePoint = hover !== null ? points[hover] : null;

  return (
    <div className="relative w-full" style={{ height }} onMouseLeave={() => setHover(null)}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-full w-full overflow-visible"
        role="img"
        aria-label="chart"
        onMouseMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          const ratio = (event.clientX - rect.left) / rect.width;
          const idx = Math.round(ratio * (data.length - 1));
          setHover(Math.max(0, Math.min(data.length - 1, idx)));
        }}
      >
        <defs>
          <linearGradient id={`fill-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.34" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75].map((ratio) => (
          <line
            key={ratio}
            x1={PAD.left}
            x2={W - PAD.right}
            y1={PAD.top + (H - PAD.top - PAD.bottom) * ratio}
            y2={PAD.top + (H - PAD.top - PAD.bottom) * ratio}
            stroke="rgba(255,255,255,0.05)"
            strokeDasharray="3 6"
          />
        ))}

        <path d={areaPath} fill={`url(#fill-${gradientId})`} />
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {activePoint ? (
          <g>
            <line
              x1={activePoint.x}
              x2={activePoint.x}
              y1={PAD.top}
              y2={H - PAD.bottom}
              stroke={color}
              strokeOpacity="0.35"
              strokeDasharray="4 4"
            />
            <circle cx={activePoint.x} cy={activePoint.y} r="8" fill={color} fillOpacity="0.16" />
            <circle cx={activePoint.x} cy={activePoint.y} r="3.6" fill={color} />
          </g>
        ) : null}

        {labels.map((label) => (
          <text
            key={label.x}
            x={label.x}
            y={H - 6}
            fill="#64748B"
            fontSize="10"
            textAnchor={label.x < 40 ? "start" : label.x > W - 40 ? "end" : "middle"}
          >
            {label.text}
          </text>
        ))}
      </svg>

      {active && activePoint ? (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-line bg-ink-800 px-2.5 py-1.5 text-[11px] shadow-xl"
          style={{
            left: `${(activePoint.x / W) * 100}%`,
            top: `${(activePoint.y / H) * 100}%`,
            marginTop: -10,
          }}
        >
          <span className="block font-semibold text-white">{fmt(active.value)}</span>
          <span className="block text-slate-400">
            {formatShortDate(locale, new Date(`${active.day}T12:00:00`))}
          </span>
        </div>
      ) : null}

      <span className="sr-only">{`max ${max}`}</span>
    </div>
  );
}

export function MiniBars({
  data,
  locale,
  color = "#34D399",
}: {
  data: Point[];
  locale: Locale;
  color?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex h-24 items-end gap-[3px]">
      {data.map((point) => (
        <div key={point.day} className="group relative flex-1">
          <div
            className="w-full rounded-t-[3px] opacity-70 transition group-hover:opacity-100"
            style={{
              height: `${Math.max(3, (point.value / max) * 88)}px`,
              backgroundColor: color,
            }}
          />
          <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-line bg-ink-800 px-2 py-1 text-[10px] text-slate-200 group-hover:block">
            {plain(locale, point.value)} · {formatShortDate(locale, new Date(`${point.day}T12:00:00`))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function Donut({
  slices,
  centerLabel,
  centerValue,
}: {
  slices: { value: number; color: string; label: string }[];
  centerLabel: string;
  centerValue: string;
}) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0) || 1;
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="relative mx-auto h-[150px] w-[150px]">
      <svg viewBox="0 0 130 130" className="h-full w-full -rotate-90">
        <circle cx="65" cy="65" r={radius} fill="none" stroke="#16212D" strokeWidth="13" />
        {slices.map((slice) => {
          const length = (slice.value / total) * circumference;
          const dash = `${Math.max(0, length - 2)} ${circumference - Math.max(0, length - 2)}`;
          const element = (
            <circle
              key={slice.label}
              cx="65"
              cy="65"
              r={radius}
              fill="none"
              stroke={slice.color}
              strokeWidth="13"
              strokeDasharray={dash}
              strokeDashoffset={-offset}
              strokeLinecap="round"
            />
          );
          offset += length;
          return element;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-semibold text-white">{centerValue}</span>
        <span className="text-[10px] uppercase tracking-wider text-slate-500">{centerLabel}</span>
      </div>
    </div>
  );
}

export function SegmentBar({ slices }: { slices: { value: number; color: string; label: string }[] }) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0) || 1;
  return (
    <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-ink-800">
      {slices.map((slice) => (
        <div
          key={slice.label}
          className={cn("h-full first:rounded-l-full last:rounded-r-full")}
          style={{ width: `${(slice.value / total) * 100}%`, backgroundColor: slice.color }}
          title={`${slice.label}: ${slice.value}`}
        />
      ))}
    </div>
  );
}
