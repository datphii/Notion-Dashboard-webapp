// Maps Notion's built-in select/status/multi-select colors to Tailwind classes
// that look reasonable in both light and dark mode.
const COLOR_MAP: Record<string, string> = {
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

export function colorClasses(color?: string | null): string {
  return COLOR_MAP[color ?? "default"] ?? COLOR_MAP.default;
}
