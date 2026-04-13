export const PRIORITY_CONFIG = {
  LOW:    { label: "Düşük",  color: "text-gray-400",   bg: "bg-gray-500/15",   border: "border-gray-500/30", dot: "bg-gray-500"   },
  NORMAL: { label: "Normal", color: "text-blue-400",   bg: "bg-blue-500/15",   border: "border-blue-500/30", dot: "bg-blue-500"   },
  HIGH:   { label: "Yüksek", color: "text-orange-400", bg: "bg-orange-500/15", border: "border-orange-500/30", dot: "bg-orange-500" },
  URGENT: { label: "Acil",   color: "text-red-400",    bg: "bg-red-500/15",    border: "border-red-500/30",  dot: "bg-red-500"    },
} as const;

export type Priority = keyof typeof PRIORITY_CONFIG;
