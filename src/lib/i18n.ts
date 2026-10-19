import type { Lang } from "@/types";

export const LANGUAGES: { code: Lang; label: string; native: string }[] = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "es", label: "Spanish", native: "Español" },
  { code: "fr", label: "French", native: "Français" },
  { code: "de", label: "German", native: "Deutsch" },
  { code: "ja", label: "Japanese", native: "日本語" },
];

type Key =
  | "dashboard"
  | "chat"
  | "research"
  | "news"
  | "weather"
  | "reports"
  | "integrations"
  | "settings"
  | "morning"
  | "afternoon"
  | "evening"
  | "askPlaceholder";

const dict: Record<Lang, Record<Key, string>> = {
  en: {
    dashboard: "Dashboard", chat: "AI Chat", research: "Web Research", news: "Latest News", weather: "Weather",
    reports: "Saved Reports", integrations: "Integrations", settings: "Settings",
    morning: "Good morning", afternoon: "Good afternoon", evening: "Good evening",
    askPlaceholder: "Ask anything — ANVEṢAṆAM AI will search the web for you…",
  },
  hi: {
    dashboard: "डैशबोर्ड", chat: "एआई चैट", research: "वेब शोध", news: "ताज़ा समाचार", weather: "मौसम",
    reports: "सहेजी रिपोर्ट", integrations: "इंटीग्रेशन", settings: "सेटिंग्स",
    morning: "सुप्रभात", afternoon: "नमस्ते", evening: "शुभ संध्या",
    askPlaceholder: "कुछ भी पूछें — ANVEṢAṆAM AI वेब पर खोजेगा…",
  },
  es: {
    dashboard: "Panel", chat: "Chat IA", research: "Investigación web", news: "Últimas noticias", weather: "Clima",
    reports: "Informes guardados", integrations: "Integraciones", settings: "Ajustes",
    morning: "Buenos días", afternoon: "Buenas tardes", evening: "Buenas noches",
    askPlaceholder: "Pregunta lo que quieras — ANVEṢAṆAM AI buscará en la web…",
  },
  fr: {
    dashboard: "Tableau de bord", chat: "Chat IA", research: "Recherche web", news: "Dernières actualités", weather: "Météo",
    reports: "Rapports enregistrés", integrations: "Intégrations", settings: "Paramètres",
    morning: "Bonjour", afternoon: "Bon après-midi", evening: "Bonsoir",
    askPlaceholder: "Posez une question — ANVEṢAṆAM AI cherchera sur le web…",
  },
  de: {
    dashboard: "Dashboard", chat: "KI-Chat", research: "Web-Recherche", news: "Aktuelle Nachrichten", weather: "Wetter",
    reports: "Gespeicherte Berichte", integrations: "Integrationen", settings: "Einstellungen",
    morning: "Guten Morgen", afternoon: "Guten Tag", evening: "Guten Abend",
    askPlaceholder: "Frag alles — ANVEṢAṆAM AI durchsucht das Web für dich…",
  },
  ja: {
    dashboard: "ダッシュボード", chat: "AIチャット", research: "ウェブリサーチ", news: "最新ニュース", weather: "天気",
    reports: "保存済みレポート", integrations: "連携", settings: "設定",
    morning: "おはようございます", afternoon: "こんにちは", evening: "こんばんは",
    askPlaceholder: "何でも聞いてください — ANVEṢAṆAM AIがウェブを検索します…",
  },
};

export function t(lang: Lang, key: Key): string {
  return dict[lang]?.[key] ?? dict.en[key];
}

export function greetingKey(date = new Date()): "morning" | "afternoon" | "evening" {
  const h = date.getHours();
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}
