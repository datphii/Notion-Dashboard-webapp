// Maps Notion's built-in select/status/multi-select colors to Tailwind classes.
// Three strengths: soft chips (multi-select tags), solid badges (status/priority,
// the fields people scan first), and small dot/border accents.

const SOFT_MAP: Record<string, string> = {
  default: "bg-gray-100 text-gray-700 dark:bg-gray-700/40 dark:text-gray-200",
  gray: "bg-gray-200 text-gray-800 dark:bg-gray-600/40 dark:text-gray-100",
  brown: "bg-amber-200/70 text-amber-900 dark:bg-amber-800/40 dark:text-amber-200",
  orange: "bg-orange-200 text-orange-900 dark:bg-orange-800/40 dark:text-orange-200",
  yellow: "bg-yellow-200 text-yellow-900 dark:bg-yellow-700/40 dark:text-yellow-200",
  green: "bg-green-200 text-green-900 dark:bg-green-800/40 dark:text-green-200",
  blue: "bg-blue-200 text-blue-900 dark:bg-blue-800/40 dark:text-blue-200",
  purple: "bg-purple-200 text-purple-900 dark:bg-purple-800/40 dark:text-purple-200",
  pink: "bg-pink-200 text-pink-900 dark:bg-pink-800/40 dark:text-pink-200",
  red: "bg-red-200 text-red-900 dark:bg-red-800/40 dark:text-red-200",
};

const SOLID_MAP: Record<string, string> = {
  default: "bg-gray-500 text-white",
  gray: "bg-gray-500 text-white",
  brown: "bg-amber-700 text-white",
  orange: "bg-orange-500 text-white",
  yellow: "bg-yellow-400 text-yellow-950",
  green: "bg-emerald-500 text-white",
  blue: "bg-blue-500 text-white",
  purple: "bg-purple-500 text-white",
  pink: "bg-pink-500 text-white",
  red: "bg-red-500 text-white",
};

const DOT_MAP: Record<string, string> = {
  default: "bg-gray-400",
  gray: "bg-gray-400",
  brown: "bg-amber-700",
  orange: "bg-orange-500",
  yellow: "bg-yellow-400",
  green: "bg-emerald-500",
  blue: "bg-blue-500",
  purple: "bg-purple-500",
  pink: "bg-pink-500",
  red: "bg-red-500",
};

const BORDER_MAP: Record<string, string> = {
  default: "border-gray-400",
  gray: "border-gray-400",
  brown: "border-amber-700",
  orange: "border-orange-500",
  yellow: "border-yellow-400",
  green: "border-emerald-500",
  blue: "border-blue-500",
  purple: "border-purple-500",
  pink: "border-pink-500",
  red: "border-red-500",
};

const RING_MAP: Record<string, string> = {
  default: "bg-gray-50 dark:bg-gray-900/20",
  gray: "bg-gray-50 dark:bg-gray-900/20",
  brown: "bg-amber-50 dark:bg-amber-950/20",
  orange: "bg-orange-50 dark:bg-orange-950/20",
  yellow: "bg-yellow-50 dark:bg-yellow-950/20",
  green: "bg-emerald-50 dark:bg-emerald-950/20",
  blue: "bg-blue-50 dark:bg-blue-950/20",
  purple: "bg-purple-50 dark:bg-purple-950/20",
  pink: "bg-pink-50 dark:bg-pink-950/20",
  red: "bg-red-50 dark:bg-red-950/20",
};

export function colorClasses(color?: string | null): string {
  return SOFT_MAP[color ?? "default"] ?? SOFT_MAP.default;
}

export function solidColorClasses(color?: string | null): string {
  return SOLID_MAP[color ?? "default"] ?? SOLID_MAP.default;
}

export function dotColorClass(color?: string | null): string {
  return DOT_MAP[color ?? "default"] ?? DOT_MAP.default;
}

export function borderColorClass(color?: string | null): string {
  return BORDER_MAP[color ?? "default"] ?? BORDER_MAP.default;
}

export function tintBgColorClass(color?: string | null): string {
  return RING_MAP[color ?? "default"] ?? RING_MAP.default;
}

const HEX_MAP: Record<string, string> = {
  default: "#6b7280",
  gray: "#6b7280",
  brown: "#92400e",
  orange: "#f97316",
  yellow: "#ca8a04",
  green: "#10b981",
  blue: "#3b82f6",
  purple: "#a855f7",
  pink: "#ec4899",
  red: "#ef4444",
};

export function hexForColor(color?: string | null): string {
  return HEX_MAP[color ?? "default"] ?? HEX_MAP.default;
}
