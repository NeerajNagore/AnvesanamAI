import type { ResearchReport } from "@/types";

export function reportToMarkdown(r: ResearchReport): string {
  const lines: string[] = [
    `# ${r.title}`,
    "",
    `*Generated ${new Date(r.createdAt).toLocaleString()} · ${r.depth} depth${r.demo ? " · DEMO DATA" : ""}*`,
    "",
    "## Summary",
    r.summary,
    "",
  ];
  if (r.keyFindings.length) {
    lines.push("## Key findings", ...r.keyFindings.map((f) => `- ${f}`), "");
  }
  for (const s of r.sections) lines.push(`## ${s.heading}`, s.body, "");
  if (r.sources.length) {
    lines.push("## Sources", ...r.sources.map((s) => `${s.id}. [${s.title}](${s.url}) — ${s.domain}`), "");
  }
  return lines.join("\n");
}

export function downloadFile(filename: string, content: string, mime: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "report";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Opens a print-friendly page so the browser's "Save as PDF" can be used. */
export function printReport(r: ResearchReport): boolean {
  const w = window.open("", "_blank", "noopener,noreferrer,width=900,height=1000");
  if (!w) return false;
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(r.title)}</title>
<style>
body{font-family:Inter,system-ui,sans-serif;max-width:760px;margin:40px auto;padding:0 24px;color:#111;line-height:1.6}
h1{font-size:26px;margin-bottom:4px}h2{font-size:18px;margin-top:28px;border-bottom:1px solid #ddd;padding-bottom:4px}
.meta{color:#666;font-size:13px}li{margin:4px 0}a{color:#4338ca}
</style></head><body>
<h1>${esc(r.title)}</h1>
<p class="meta">${esc(new Date(r.createdAt).toLocaleString())} · ${esc(r.depth)} depth${r.demo ? " · DEMO DATA" : ""}</p>
<h2>Summary</h2><p>${esc(r.summary)}</p>
${r.keyFindings.length ? `<h2>Key findings</h2><ul>${r.keyFindings.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>` : ""}
${r.sections.map((s) => `<h2>${esc(s.heading)}</h2><p>${esc(s.body).replace(/\n/g, "<br>")}</p>`).join("")}
${r.sources.length ? `<h2>Sources</h2><ol>${r.sources.map((s) => `<li>${esc(s.title)} — <a href="${esc(s.url)}">${esc(s.url)}</a></li>`).join("")}</ol>` : ""}
<script>window.onload=function(){window.print()}</script></body></html>`;
  w.document.write(html);
  w.document.close();
  return true;
}
