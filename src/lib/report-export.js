import { jsPDF } from "jspdf";
import {
  generateChartConfigs,
  renderChartSVG,
  svgToImage,
  summarizeData,
} from "@/lib/report-charts";
import {
  getDepartment,
  getDepartmentSignatory,
  REPORT_DEPARTMENT_MAP,
  DEFAULT_DEPARTMENT_ID,
} from "@/lib/report-departments";

const NAVY = [15, 59, 124];      // #0F3B7C
const BLUE = [37, 99, 235];      // #2563EB
const BORDER = [209, 217, 226];  // #D1D9E2
const WHITE = [255, 255, 255];
const TEXT_DARK = [75, 85, 99];  // #4B5563
const TEXT_MUTED = [107, 114, 128]; // #6B7280
const AI_GREEN = [21, 93, 66];   // #155D42
const AI_GREEN2 = [87, 156, 103]; // #579C67
const AI_BG = [241, 247, 246];   // #F1F7F6
const AI_BORDER = [212, 231, 225]; // #D4E7E1

const EXCLUDED_KEYS = ["id", "created_date", "updated_date", "created_by_id"];

function getKeys(data) {
  if (!data || data.length === 0) return [];
  const keySet = new Set();
  data.forEach((row) => Object.keys(row).forEach((k) => keySet.add(k)));
  return [...keySet].filter((k) => !EXCLUDED_KEYS.includes(k));
}

function formatValue(val) {
  if (val === null || val === undefined) return "—";
  if (typeof val === "boolean") return val ? "Oui" : "Non";
  if (typeof val === "number") return val.toLocaleString("fr-FR");
  if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}/.test(val)) {
    const date = new Date(val);
    if (!Number.isNaN(date.getTime())) return date.toLocaleDateString("fr-FR");
  }
  return String(val);
}

function formatFieldLabel(key) {
  return String(key)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function textForPdf(value, maxLength = 56) {
  // Helvetica, the built-in jsPDF font, cannot render emoji. Removing those
  // characters avoids the corrupted symbols visible in exported reports.
  const clean = String(value ?? "")
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  return clean.length > maxLength ? `${clean.slice(0, Math.max(0, maxLength - 1))}…` : clean;
}

function formatDate() {
  return new Date().toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric",
  });
}

function formatDateShort() {
  return new Date().toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric",
  });
}

async function loadImageAsDataURL(url) {
  return new Promise((resolve) => {
    if (!url) return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || 128;
        canvas.height = img.naturalHeight || 128;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch (e) { resolve(null); }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function computeKPIs(data, keys) {
  const kpis = [];
  if (data.length === 0) return kpis;
  kpis.push({ label: "Enregistrements", value: data.length });
  keys.forEach((k) => {
    const vals = data.map((r) => r[k]).filter((v) => typeof v === "number" && isFinite(v));
    if (vals.length > data.length * 0.3) {
      const sum = vals.reduce((a, b) => a + b, 0);
      kpis.push({ label: k, value: sum });
    }
  });
  return kpis.slice(0, 4);
}

async function generatePrediction(title, data, company) {
  if (!data || data.length === 0) return null;
  try {
    const summary = summarizeData(data);
    const companyName = company?.nom_entreprise || "l'entreprise";
    const prompt = `Tu es un analyste ERP expert travaillant pour ${companyName}. Analyse les données du rapport "${title}" et génère un rapport d'analyse avec prédictions en français.

RÉSUMÉ DES DONNÉES:
${summary}

Génère ta réponse en Markdown avec ces sections:

1. **Analyse** — 3-4 points clés sur les tendances et la situation actuelle
2. **Prédictions (30 jours)** — prévisions chiffrées pour le mois prochain
3. **Recommandations** — 3 actions prioritaires concrètes
4. **Risques** — 2-3 risques identifiés à surveiller

Sois concis, professionnel et précis avec des chiffres.`;

    const { integrations } = await import("@/api/integrations");
    const response = await integrations.Core.InvokeLLM({ prompt, add_context_from_internet: false });
    return typeof response === "string" ? response : String(response);
  } catch (err) {
    console.error("Prediction error:", err);
    return null;
  }
}

function getSignatories(title, company, opts = {}) {
  const deptId = opts.departmentId || REPORT_DEPARTMENT_MAP[title] || DEFAULT_DEPARTMENT_ID;
  const dept = getDepartment(deptId);
  const deptSignatory = getDepartmentSignatory(deptId, company);
  const dg = {
    name: company?.directeur_nom || "",
    title: company?.directeur_titre || "Directeur Général",
  };
  return { deptId, dept, deptSignatory, dg };
}

// ─── Signature block (white bg style) ─────────────────────────────────────────
function addSignatureBlock(doc, company, pageWidth, pageHeight, margin, opts = {}, title, dept, preferredY) {
  const { deptSignatory, dg } = getSignatories(title, company, opts);
  const blockW = pageWidth - margin * 2;
  const sigStartY = Math.min(preferredY ?? pageHeight - 50, pageHeight - 50);

  // Signature block container
  doc.setFillColor(245, 248, 250);
  doc.setDrawColor(BORDER[0], BORDER[1], BORDER[2]);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, sigStartY - 4, blockW, 44, 6, 6, "FD");

  // Header line: "Lu et approuvé..."
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
  doc.text(`Lu et approuvé le ${formatDate()} — ${dept?.label || "Département"}`, margin + 10, sigStartY + 2);

  // Vertical dashed separator
  const halfW = blockW / 2 - 8;
  doc.setDrawColor(BORDER[0], BORDER[1], BORDER[2]);
  doc.setLineWidth(0.3);
  const dashX = margin + halfW + 8;
  doc.line(dashX, sigStartY + 8, dashX, sigStartY + 36);

  // Left: Dept head
  drawSigBlock(doc, margin + 10, sigStartY + 10, halfW - 4,
    deptSignatory.name || "__________________",
    deptSignatory.title || "Responsable",
    "Responsable");

  // Right: DG
  drawSigBlock(doc, dashX + 6, sigStartY + 10, halfW - 8,
    dg.name || "__________________",
    dg.title || "Directeur Général",
    "Directeur");
}

function drawSigBlock(doc, x, y, w, name, role, type) {
  // Icon circle
  doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
  doc.circle(x + 7, y + 7, 6, "F");

  // Small user icon (just a dot for simplicity)
  doc.setFillColor(WHITE[0], WHITE[1], WHITE[2]);
  doc.circle(x + 7, y + 7, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
  doc.text(role, x + 16, y + 6);

  // Signature line
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(x, y + 24, x + w, y + 24);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
  doc.text(name, x, y + 20);
  doc.setFontSize(6.5);
  doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
  doc.text("Signature & cachet", x, y + 30);
}

// ─── Render prediction content into PDF ────────────────────────────────────────
function addPredictionContent(doc, prediction, pageWidth, margin, startY) {
  if (!prediction) return startY;
  const maxW = pageWidth - margin * 2;
  let y = startY;
  const lineH = 4.8;
  const lines = prediction.split("\n");
  for (const line of lines) {
    if (y > 260) break;
    const trimmed = line.trim();
    if (!trimmed) { y += lineH * 0.5; continue; }
    if (trimmed.startsWith("#") || trimmed.startsWith("**")) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(AI_GREEN[0], AI_GREEN[1], AI_GREEN[2]);
      doc.text(textForPdf(trimmed.replace(/[#*]/g, "").trim()), margin + 2, y);
      doc.setFont("helvetica", "normal");
      y += lineH + 2;
    } else if (trimmed.startsWith("-") || trimmed.startsWith("•")) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
      const wrapped = doc.splitTextToSize(textForPdf("  " + trimmed.replace(/^[-•]\s*/, ""), 220), maxW);
      doc.text(wrapped, margin + 2, y);
      y += wrapped.length * lineH + 1;
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
      const wrapped = doc.splitTextToSize(textForPdf(trimmed, 220), maxW);
      doc.text(wrapped, margin + 2, y);
      y += (wrapped.length - 1) * lineH;
    }
    y += lineH;
  }
  return y;
}

// ─── Main A4 Portrait PDF Export ───────────────────────────────────────────────
export async function exportDataToPDF(title, data, subtitle = "", company = null, opts = {}) {
  if (!data || data.length === 0) {
    alert("Aucune donnée à exporter.");
    return;
  }

  const keys = getKeys(data);
  const displayKeys = keys.slice(0, 7);
  const rows = data.map((item) => displayKeys.map((k) => formatValue(item[k])));

  let logoDataUrl = null;
  if (company?.logo_url) {
    logoDataUrl = await loadImageAsDataURL(company.logo_url);
  }

  const chartConfigs = generateChartConfigs(data);
  const chartImages = [];
  for (const chart of chartConfigs) {
    const svg = renderChartSVG(chart);
    const img = await svgToImage(svg, 420, 180);
    if (img) chartImages.push({ ...chart, img });
  }

  const prediction = await generatePrediction(title, data, company);
  const { dept } = getSignatories(title, company, opts);
  const companyName = company?.nom_entreprise || "MY Logistics";

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();  // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 14;
  const contentW = pageWidth - margin * 2;

  // ─── PAGE 1 ─────────────────────────────────────────────────────────────────

  // WHITE background (default)
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // ── Top header bar (navy) ──────────────────────────────────────────────────
  doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
  doc.rect(0, 0, pageWidth, 30, "F");
  // Refined blue accent line
  doc.setFillColor(BLUE[0], BLUE[1], BLUE[2]);
  doc.rect(0, 30, pageWidth, 2, "F");

  // Logo + company name (left)
  if (logoDataUrl) {
    try { doc.addImage(logoDataUrl, "PNG", margin, 4, 18, 18); } catch (e) {}
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text(companyName, margin + 22, 14);
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text(companyName, margin, 14);
  }

  // Subtitle in header
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(180, 200, 230);
  doc.text("RAPPORT DE GESTION", margin, 22);

  // Date stamp (right)
  doc.setFontSize(8);
  doc.setTextColor(180, 200, 230);
  doc.text(`Émis le ${formatDate()}`, pageWidth - margin, 14, { align: "right" });
  doc.setFontSize(6.5);
  doc.setTextColor(220, 231, 249);
  doc.text("DOCUMENT CONFIDENTIEL", pageWidth - margin, 21, { align: "right" });

  // ── Title section ─────────────────────────────────────────────────────────
  let y = 42;

  // Icon square (navy rounded)
  doc.setFillColor(BLUE[0], BLUE[1], BLUE[2]);
  doc.roundedRect(margin, y, 16, 16, 3, 3, "F");
  // White chart icon inside
  doc.setFillColor(255, 255, 255);
  doc.rect(margin + 4, y + 4, 3, 9, "F");
  doc.rect(margin + 8, y + 6, 3, 7, "F");

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
  doc.text(title, margin + 22, y + 10);

  // Subtitle
  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
    doc.text(subtitle, margin + 22, y + 16);
  }

  y += 22;

  // ── Metadata banner ──────────────────────────────────────────────────────
  doc.setFillColor(245, 248, 250);
  doc.setDrawColor(BORDER[0], BORDER[1], BORDER[2]);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, contentW, 9, 3, 3, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);

  // Document icon
  doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
  doc.rect(margin + 4, y + 2, 5, 5, "F");
  doc.text(`${rows.length} enregistrements`, margin + 12, y + 6);

  // Separator
  doc.setDrawColor(BORDER[0], BORDER[1], BORDER[2]);
  doc.line(margin + contentW / 2, y + 1, margin + contentW / 2, y + 8);

  // User icon
  doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
  doc.circle(margin + contentW / 2 + 10, y + 4.5, 2.5, "F");
  doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
  doc.text(dept.label, margin + contentW / 2 + 16, y + 6);

  y += 13;

  // ── KPI cards ────────────────────────────────────────────────────────────
  // Three cards keep the executive summary readable even when source values
  // are long (for example, imported payroll values).
  const kpis = computeKPIs(data, keys).slice(0, 3);
  if (kpis.length > 0) {
    const cardW = (contentW - (kpis.length - 1) * 6) / kpis.length;
    kpis.forEach((kpi, i) => {
      const cx = margin + i * (cardW + 6);
      // Card bg + border
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(BORDER[0], BORDER[1], BORDER[2]);
      doc.setLineWidth(0.4);
      doc.roundedRect(cx, y, cardW, 27, 3, 3, "FD");

      // Thin accent rule rather than a decorative icon.
      doc.setFillColor(BLUE[0], BLUE[1], BLUE[2]);
      doc.roundedRect(cx, y, 3, 27, 2, 2, "F");

      // Value
      const val = typeof kpi.value === "number"
        ? kpi.value.toLocaleString("fr-FR")
        : String(kpi.value);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
      doc.text(textForPdf(val, 14), cx + 8, y + 12);

      // Label
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
      doc.text(textForPdf(formatFieldLabel(kpi.label), 22), cx + 8, y + 20);
    });
    y += 33;
  }

  // ── Visualizations ────────────────────────────────────────────────────────
  let chartY = y + 6;
  if (chartImages.length > 0) {
    // Section header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.text("Visualisations", margin, chartY);
    chartY += 4;

    // Divider
    doc.setDrawColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.setLineWidth(1);
    doc.line(margin, chartY, pageWidth - margin, chartY);
    chartY += 8;

    const chartW = chartImages.length >= 2 ? (contentW - 8) / 2 : contentW;
    const chartH = 58;

    chartImages.slice(0, 2).forEach((chart, i) => {
      const cx = chartImages.length >= 2 ? margin + i * (chartW + 8) : margin;
      // Chart card
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(BORDER[0], BORDER[1], BORDER[2]);
      doc.setLineWidth(0.4);
      doc.roundedRect(cx, chartY, chartW, chartH, 4, 4, "FD");

      // Chart title centered
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
      doc.text(chart.title, cx + chartW / 2, chartY + 5, { align: "center" });

      try {
        doc.addImage(chart.img, "PNG", cx + 4, chartY + 7, chartW - 8, chartH - 12);
      } catch (e) {}
    });
    chartY += chartH + 12;
  }

  // ── AI Analysis block ────────────────────────────────────────────────────
  if (prediction) {
    const aiY = chartY + 2;
    const aiH = 55;
    // AI section bg (light mint)
    doc.setFillColor(AI_BG[0], AI_BG[1], AI_BG[2]);
    doc.setDrawColor(AI_BORDER[0], AI_BORDER[1], AI_BORDER[2]);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, aiY, contentW, aiH, 4, 4, "FD");

    // Header row
    // Green sparkle icon
    doc.setFillColor(AI_GREEN[0], AI_GREEN[1], AI_GREEN[2]);
    doc.circle(margin + 6, aiY + 5, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(AI_GREEN[0], AI_GREEN[1], AI_GREEN[2]);
    doc.text("Analyse & Prédictions IA", margin + 12, aiY + 7);

    // Divider
    doc.setDrawColor(AI_BORDER[0], AI_BORDER[1], AI_BORDER[2]);
    doc.setLineWidth(0.3);
    doc.line(margin, aiY + 10, pageWidth - margin, aiY + 10);

    // Content
    addPredictionContent(doc, prediction, pageWidth, margin, aiY + 14);
    chartY = aiY + aiH + 6;
  } else {
    chartY += 6;
  }

  // The first page remains a clean executive summary. The complete register
  // is deliberately placed on the next page, avoiding any table/footer clash.
  const colW = contentW / displayKeys.length;
  const summaryY = Math.min(chartY + 8, pageHeight - 28);
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(BORDER[0], BORDER[1], BORDER[2]);
  doc.roundedRect(margin, summaryY, contentW, 12, 3, 3, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
  doc.text("Registre détaillé", margin + 5, summaryY + 5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
  doc.text(`${rows.length} ligne${rows.length > 1 ? "s" : ""} disponible${rows.length > 1 ? "s" : ""} à la page suivante.`, margin + 5, summaryY + 9);

  // ── Footer (navy) ────────────────────────────────────────────────────────
  doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
  doc.rect(0, pageHeight - 14, pageWidth, 14, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(`${companyName} — ${dept.label}`, margin, pageHeight - 6);
  doc.text("Page 1 / 2", pageWidth - margin, pageHeight - 6, { align: "right" });

  // ─── PAGE 2 ─────────────────────────────────────────────────────────────────
  doc.addPage();

  // WHITE background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Header bar (navy)
  doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
  doc.rect(0, 0, pageWidth, 18, "F");
  doc.setFillColor(BLUE[0], BLUE[1], BLUE[2]);
  doc.rect(0, 18, pageWidth, 2, "F");

  // Icon + title
  doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
  doc.roundedRect(margin, 3, 10, 10, 2, 2, "F");
  doc.setFillColor(255, 255, 255);
  doc.rect(margin + 2, 5, 2, 6, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(title, margin + 14, 11);

  // Subtitle
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(180, 200, 230);
  doc.text(`${rows.length} enregistrements · ${dept.label}`, pageWidth - margin, 11, { align: "right" });

  // Divider
  doc.setDrawColor(NAVY[0], NAVY[1], NAVY[2]);
  doc.setLineWidth(1);
  doc.line(margin, 24, pageWidth - margin, 24);

  // Full table
  let ty = 30;
  const rowH = 7;
  const headerH = 9;

  // Table header (navy)
  doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
  doc.rect(margin, ty, contentW, headerH, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  displayKeys.forEach((h, i) => {
    doc.text(formatFieldLabel(h).substring(0, 15), margin + i * colW + 2, ty + 6);
  });
  ty += headerH;

  // Data rows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  const maxTableY = pageHeight - 30;

  rows.forEach((row, i) => {
    if (ty + rowH > maxTableY) {
      doc.addPage();

      // Overflow page
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageWidth, pageHeight, "F");
      doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
      doc.rect(0, 0, pageWidth, 10, "F");
      doc.rect(0, 10, pageWidth, 2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text(`${title} (suite)`, margin, 8);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(180, 200, 230);
      doc.text(companyName, pageWidth - margin, 8, { align: "right" });

      // Reprint header
      doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
      doc.rect(margin, 14, contentW, headerH, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);
      displayKeys.forEach((h, j) => {
        doc.text(formatFieldLabel(h).substring(0, 15), margin + j * colW + 2, 20);
      });
      ty = 23;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
    }

    if (i % 2 === 1) {
      doc.setFillColor(245, 248, 250);
      doc.rect(margin, ty, contentW, rowH, "F");
    }
    doc.setDrawColor(BORDER[0], BORDER[1], BORDER[2]);
    doc.setLineWidth(0.2);
    doc.rect(margin, ty, contentW, rowH, "FD");
    doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
    row.forEach((cell, j) => {
      doc.text(textForPdf(cell, 17), margin + j * colW + 2, ty + 5);
    });
    ty += rowH;
  });

  // ── Signature block ──────────────────────────────────────────────────────
  // For a short register, keep approvals close to the table. Long registers
  // stay safely above the footer on their final page.
  addSignatureBlock(doc, company, pageWidth, pageHeight, margin, opts, title, dept, ty + 13);

  // Footer (navy) on all pages
  const pageCount = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.rect(0, pageHeight - 14, pageWidth, 14, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    const ph = doc.internal.pageSize.getHeight();
    doc.text(`${companyName} — ${dept.label}`, margin, ph - 6);
    doc.text(`Page ${p} / ${pageCount}`, pageWidth - margin, ph - 6, { align: "right" });
  }

  doc.save(`${title.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`);
}

// ─── Word Export (A4, white + navy style) ─────────────────────────────────────
export async function exportDataToWord(title, data, subtitle = "", company = null, opts = {}) {
  if (!data || data.length === 0) {
    alert("Aucune donnée à exporter.");
    return;
  }

  const keys = getKeys(data);
  const displayKeys = keys.slice(0, 7);
  const rows = data.map((item) => displayKeys.map((k) => formatValue(item[k])));
  const kpis = computeKPIs(data, keys);

  const escapeHtml = (str) =>
    String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const chartConfigs = generateChartConfigs(data);
  const chartHtmlParts = [];
  for (const chart of chartConfigs) {
    const svg = renderChartSVG(chart);
    const img = await svgToImage(svg, 420, 180);
    if (img) {
      chartHtmlParts.push(`
        <div style="margin-bottom: 12px; break-inside: avoid;">
          <h4 style="margin: 0 0 6px; font-size: 10pt; color: #0F3B7C; font-weight: 600;">${escapeHtml(chart.title)}</h4>
          <img src="${img}" style="width: 100%; max-width: 480px; border: 1px solid #D1D9E2; border-radius: 6px;" />
        </div>`);
    }
  }

  const prediction = await generatePrediction(title, data, company);
  const { dept, deptSignatory, dg } = getSignatories(title, company, opts);
  const companyName = company?.nom_entreprise || "MY Logistics";

  const legalInfo = [
    company?.ice ? `ICE: ${escapeHtml(company.ice)}` : null,
    company?.rc ? `RC: ${escapeHtml(company.rc)}` : null,
    company?.telephone ? `Tél: ${escapeHtml(company.telephone)}` : null,
  ].filter(Boolean).join("   |   ");

  const kpiHtml = kpis.map((k) => `
    <td style="width:${100 / Math.max(kpis.length, 1)}%;text-align:center;padding:12px 8px;background:#F8FAFC;border:1px solid #D7E0EC;">
      <div style="font-size:15pt;font-weight:700;color:#0F3B7C;line-height:1.1;">${typeof k.value === "number" ? k.value.toLocaleString("fr-FR") : escapeHtml(k.value)}</div>
      <div style="font-size:8pt;color:#64748B;margin-top:5px;text-transform:uppercase;letter-spacing:.4px;">${escapeHtml(formatFieldLabel(k.label))}</div>
    </td>`).join("");

  const tableRows = rows
    .map((row, i) =>
      `<tr style="${i % 2 ? "background-color:#F5F8FA;" : ""}">` +
      row.map((cell) => `<td style="padding:5px 8px;border:1px solid #e5e7eb;font-size:9pt;color:#4B5563;">${escapeHtml(cell)}</td>`).join("") +
      `</tr>`
    )
    .join("");

  const tableHeader = displayKeys
    .map((h) => `<th style="padding:8px;background:#0F3B7C;color:white;font-size:8pt;font-weight:700;text-align:left;text-transform:uppercase;letter-spacing:.25px;">${escapeHtml(formatFieldLabel(h))}</th>`)
    .join("");

  const predictionHtml = prediction
    ? prediction
        .replace(/\*\*(.+?)\*\*/g, "<strong style='color:#155D42;'>$1</strong>")
        .replace(/^#{1,3}\s+(.+)$/gm, '<h3 style="color:#155D42;margin:8px 0 4px;font-size:11pt;">$1</h3>')
        .replace(/^[-•]\s+(.+)$/gm, "<li style='color:#4B5563;font-size:9pt;'>$1</li>")
        .replace(/\n\n/g, "</p><p>")
    : "";

  const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>
  body { font-family: Aptos, Calibri, Arial, sans-serif; font-size: 10pt; margin: 0; color: #334155; line-height: 1.45; }
  .page { margin: 15mm 18mm 18mm; }
  .header { background-color: #0B1F3A; border-bottom: 4px solid #2563EB; padding: 16px 20px; margin: -15mm -18mm 0; }
  .header h1 { font-size: 17pt; font-weight: bold; letter-spacing: .2px; color: white; margin: 0 0 4px 0; }
  .header .sub { font-size: 8pt; letter-spacing: 1px; color: #BFDBFE; text-transform: uppercase; }
  .header .date { font-size: 8pt; color: #DBEAFE; text-align: right; }
  .confidential { font-size: 7pt; color: #93C5FD; letter-spacing: .8px; text-align: right; margin-top: 5px; }
  .title-section { padding: 18px 0 8px; border-bottom: 1px solid #D7E0EC; }
  .eyebrow { font-size: 8pt; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #2563EB; margin-bottom: 4px; }
  .title-section h2 { font-size: 23pt; font-weight: bold; color: #0F3B7C; margin: 0; }
  .title-section p { font-size: 9pt; color: #64748B; margin: 5px 0 0; }
  .meta-banner { background: #F8FAFC; border-left: 4px solid #2563EB; padding: 9px 12px; margin: 12px 0; font-size: 9pt; color: #334155; }
  .kpi-strip { width: 100%; border-collapse: separate; border-spacing: 6px 0; margin: 14px -6px; }
  .section-title { font-size: 12pt; font-weight: 700; color: #0F3B7C; margin: 18px 0 8px; padding-bottom: 5px; border-bottom: 2px solid #2563EB; }
  table { width: 100%; border-collapse: collapse; font-size: 8.5pt; margin-top: 7px; }
  th { background-color: #0F3B7C; color: white; padding: 8px; font-weight: 700; text-align: left; }
  td { background-color: white; color: #334155; padding: 7px 8px; border: 1px solid #E2E8F0; vertical-align: top; }
  tr:nth-child(even) td { background-color: #F8FAFC; }
  .ai-block { background: #F1F7F6; border-left: 4px solid #155D42; padding: 12px 14px; margin: 10px 0; font-size: 9pt; line-height: 1.6; }
  .ai-block h3 { color: #155D42; margin: 8px 0 4px; }
  .ai-block li { color: #4B5563; font-size: 9pt; }
  .footer { background-color: #0B1F3A; border-top: 3px solid #2563EB; color: white; padding: 10px 18px; margin: 20mm -18mm -18mm; font-size: 8pt; }
  .sig-block { background: #F8FAFC; border: 1px solid #D7E0EC; padding: 16px 20px; margin-top: 28px; }
  .sig-block .date-line { font-size: 8pt; color: #475569; margin-bottom: 12px; text-align: center; }
  .sig-table { width: 100%; border-collapse: collapse; }
  .sig-table td { width: 50%; padding: 8px 16px; vertical-align: top; border-top: 1px dashed #D1D9E2; }
  .sig-table td:first-child { border-right: 1px dashed #D1D9E2; }
  .sig-icon { display: inline-block; width: 8px; height: 8px; background: #2563EB; border-radius: 50%; vertical-align: middle; margin-right: 6px; }
  @page { size: A4 portrait; margin: 0; }
</style></head>
<body>

<div class="page">
<div class="header">
  <table width="100%" cellpadding="0" cellspacing="0"><tr>
    <td><h1>${escapeHtml(companyName)}</h1><div class="sub">Rapport de gestion</div></td>
    <td align="right"><div class="date">Émis le ${formatDate()}</div><div class="confidential">DOCUMENT CONFIDENTIEL</div></td>
  </tr></table>
</div>

<div class="title-section">
  <div class="eyebrow">Synthèse opérationnelle</div>
  <h2>${escapeHtml(title)}</h2>
  ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ""}
</div>

${legalInfo ? `<p style="font-size:8pt;color:#6B7280;margin:4px 0 8px;">${legalInfo}</p>` : ""}

<div class="meta-banner"><strong>Périmètre du rapport :</strong> ${escapeHtml(dept.label)} &nbsp;&nbsp;|&nbsp;&nbsp; <strong>${rows.length}</strong> enregistrements analysés</div>

<table class="kpi-strip"><tr>${kpiHtml}</tr></table>

${chartHtmlParts.length > 0 ? `<div class="section-title">Visualisations</div><div>${chartHtmlParts.join("")}</div>` : ""}

${prediction ? `
<div class="section-title">🤖 Analyse &amp; Prédictions IA</div>
<div class="ai-block">${predictionHtml}</div>` : ""}

<div class="section-title">Données détaillées</div>
<table>
  <thead><tr>${tableHeader}</tr></thead>
  <tbody>${tableRows}</tbody>
</table>

<div class="sig-block">
  <p class="date-line">Lu et approuvé le ${formatDate()} — ${dept.label}</p>
  <table class="sig-table">
    <tr>
      <td style="text-align:center;">
        <span class="sig-icon"></span>
        <strong style="font-size:10pt;color:#0F3B7C;">${escapeHtml(deptSignatory.title || "Responsable")}</strong><br/>
        <div style="border-top:1px solid #000;width:180px;margin:20px auto 4px;"></div>
        <span style="font-size:9pt;">${escapeHtml(deptSignatory.name || "______________________")}</span><br/>
        <span style="font-size:8pt;color:#6B7280;">Signature &amp; cachet</span>
      </td>
      <td style="text-align:center;">
        <span class="sig-icon"></span>
        <strong style="font-size:10pt;color:#0F3B7C;">${escapeHtml(dg.title || "Directeur Général")}</strong><br/>
        <div style="border-top:1px solid #000;width:180px;margin:20px auto 4px;"></div>
        <span style="font-size:9pt;">${escapeHtml(dg.name || "______________________")}</span><br/>
        <span style="font-size:8pt;color:#6B7280;">Signature &amp; cachet</span>
      </td>
    </tr>
  </table>
</div>
</div>

<div class="footer">
  <table width="100%" cellpadding="0" cellspacing="0"><tr>
    <td>${escapeHtml(companyName)} — ${escapeHtml(dept.label)}</td>
    <td align="right">Rapport généré automatiquement</td>
  </tr></table>
</div>

</body></html>`;

  const blob = new Blob([html], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}
