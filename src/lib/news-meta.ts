import {
  Briefcase,
  Clapperboard,
  Cpu,
  Globe2,
  HeartPulse,
  Newspaper,
  Trophy,
  FlaskConical,
  type LucideIcon,
} from "lucide-react";
import type { NewsCategory } from "@/types";

export const NEWS_CATEGORIES: {
  id: NewsCategory | "all";
  label: string;
  Icon: LucideIcon;
  gradient: string;
}[] = [
  { id: "all", label: "All", Icon: Newspaper, gradient: "from-indigo-500/30 to-purple-500/30" },
  { id: "technology", label: "Technology", Icon: Cpu, gradient: "from-blue-500/30 to-cyan-500/20" },
  { id: "business", label: "Business", Icon: Briefcase, gradient: "from-emerald-500/25 to-teal-500/20" },
  { id: "science", label: "Science", Icon: FlaskConical, gradient: "from-violet-500/30 to-fuchsia-500/20" },
  { id: "health", label: "Health", Icon: HeartPulse, gradient: "from-rose-500/25 to-pink-500/20" },
  { id: "sports", label: "Sports", Icon: Trophy, gradient: "from-amber-500/25 to-orange-500/20" },
  { id: "world", label: "World", Icon: Globe2, gradient: "from-sky-500/30 to-indigo-500/20" },
  { id: "entertainment", label: "Entertainment", Icon: Clapperboard, gradient: "from-fuchsia-500/30 to-purple-500/20" },
];

export const categoryMeta = (id: NewsCategory) => NEWS_CATEGORIES.find((c) => c.id === id) ?? NEWS_CATEGORIES[0];
