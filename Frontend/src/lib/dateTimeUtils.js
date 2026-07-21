export function secToHMS(sec) {
  if (sec == null || isNaN(sec)) return "00:00:00";
  const s = Math.abs(Math.round(Number(sec)));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

export function fmtDateTime(iso) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("en-GB", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
    });
  } catch { return iso; }
}

// Map app i18n language codes to BCP-47 locale tags for date formatting.
const USAGE_LOCALE_MAP = {
  en: "en-GB", fr: "fr-FR", es: "es-ES", pt: "pt-BR", idn: "id-ID", ar: "ar",
};

/**
 * Human date label for a usage card's period tab.
 * @param {"today"|"yesterday"|"thisweek"|"thisWeek"} period
 * @param {string} lang - current i18n language (e.g. "en", "fr")
 * Returns e.g. "29 May 2026" or "25 May 2026 – 29 May 2026" (week-to-date).
 */
export function getUsagePeriodLabel(period, lang = "en") {
  const locale = USAGE_LOCALE_MAP[lang] || "en-GB";
  const opts = { day: "numeric", month: "short", year: "numeric" };
  const today = new Date();
  const fmt = (d) => d.toLocaleDateString(locale, opts);

  if (period === "yesterday") {
    const y = new Date(today);
    y.setDate(y.getDate() - 1);
    return fmt(y);
  }
  if (period === "thisweek" || period === "thisWeek") {
    const dow = (today.getDay() + 6) % 7; // 0 = Monday
    const start = new Date(today);
    start.setDate(today.getDate() - dow);
    let end = new Date(start);
    end.setDate(start.getDate() + 6);
    if (end > today) end = today; // don't show future dates (week-to-date)
    return `${fmt(start)} – ${fmt(end)}`;
  }
  return fmt(today); // "today" (default)
}

export function diffHMS(startIso, endIso) {
  try {
    const diff = Math.max(0, Math.round((new Date(endIso) - new Date(startIso)) / 1000));
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  } catch { return "—"; }
}
