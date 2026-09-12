"use client";

import { hexForColor } from "@/lib/colors";

export interface DonutSegment {
  key: string;
  label: string;
  color?: string;
  count: number;
}

export default function DonutChart({
  segments,
  total,
  size = 160,
  strokeWidth = 26,
}: {
  segments: DonutSegment[];
  total: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className="shrink-0 -rotate-90"
    >
      {total === 0 ? (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-gray-200 dark:text-neutral-800"
          strokeWidth={strokeWidth}
        />
      ) : (
        segments.map((s) => {
          const fraction = s.count / total;
          const dash = fraction * circumference;
          const el = (
            <circle
              key={s.key}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={hexForColor(s.color)}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap={segments.length === 1 ? "butt" : "round"}
            />
          );
          offset += dash;
          return el;
        })
      )}
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        transform={`rotate(90 ${size / 2} ${size / 2})`}
        className="fill-current text-2xl font-bold text-gray-800 dark:text-gray-100"
      >
        {total}
      </text>
    </svg>
  );
}
