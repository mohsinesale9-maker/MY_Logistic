const CHART_COLORS = [
  "#2563eb",
  "#16a34a",
  "#f59e0b",
  "#dc2626",
  "#9333ea",
  "#0891b2",
  "#db2777",
  "#475569",
];

const MONTHS = [
  "Jan",
  "Fév",
  "Mar",
  "Avr",
  "Mai",
  "Juin",
  "Juil",
  "Août",
  "Sep",
  "Oct",
  "Nov",
  "Déc",
];

const EXCLUDED_KEYS = ["id", "created_date", "updated_date", "created_by_id"];

export function getMonth(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d.getMonth();
}

/**
 * Detects chart-worthy fields in the data and generates chart configs.
 */
export function generateChartConfigs(data) {
  if (!data || data.length === 0) return [];
  const sample = data[0];
  const charts = [];

  // 1. Bar chart by status / type
  const groupField = sample.statut ? "statut" : sample.type ? "type" : null;
  if (groupField) {
    const map = {};
    data.forEach((d) => {
      const k = d[groupField] || "inconnu";
      map[k] = (map[k] || 0) + 1;
    });
    charts.push({
      type: "bar",
      title: `Répartition par ${groupField}`,
      data: Object.entries(map).map(([label, value]) => ({ label, value })),
    });
  }

  // 2. Pie chart by category
  if (sample.categorie) {
    const map = {};
    data.forEach((d) => {
      const k = d.categorie || "Autre";
      map[k] = (map[k] || 0) + 1;
    });
    charts.push({
      type: "pie",
      title: "Répartition par catégorie",
      data: Object.entries(map).map(([label, value]) => ({ label, value })),
    });
  }

  // 3. Line chart: monthly trend of a numeric field
  const numericField = sample.montant_ttc
    ? "montant_ttc"
    : sample.total
    ? "total"
    : sample.montant
    ? "montant"
    : sample.net_paye
    ? "net_paye"
    : null;
  const dateField = sample.date ? "date" : sample.date_debut ? "date_debut" : null;
  if (dateField) {
    const monthMap = new Array(12).fill(0);
    if (numericField) {
      data.forEach((d) => {
        const m = getMonth(d[dateField]);
        if (m !== null) monthMap[m] += d[numericField] || 0;
      });
      charts.push({
        type: "line",
        title: `Évolution mensuelle (${numericField})`,
        data: MONTHS.map((label, i) => ({ label, value: Math.round(monthMap[i]) })),
      });
    } else {
      data.forEach((d) => {
        const m = getMonth(d[dateField]);
        if (m !== null) monthMap[m] += 1;
      });
      charts.push({
        type: "line",
        title: "Évolution mensuelle (nombre)",
        data: MONTHS.map((label, i) => ({ label, value: monthMap[i] })),
      });
    }
  }

  return charts.slice(0, 4);
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function barChartSVG(data, width = 500, height = 240) {
  if (!data || data.length === 0) return "";
  const max = Math.max(...data.map((d) => d.value), 1);
  const padL = 50;
  const padB = 40;
  const padT = 15;
  const chartW = width - padL - 15;
  const chartH = height - padB - padT;
  const barCount = data.length;
  const slotW = chartW / barCount;
  const barW = Math.min(slotW * 0.65, 50);
  const gap = slotW - barW;

  let bars = "";
  let labels = "";
  let yLabels = "";

  // Y axis gridlines
  for (let i = 0; i <= 4; i++) {
    const y = padT + chartH - (i / 4) * chartH;
    const val = Math.round((i / 4) * max);
    yLabels += `<line x1="${padL}" y1="${y}" x2="${width - 15}" y2="${y}" stroke="#e2e8f0" stroke-width="0.5"/>`;
    yLabels += `<text x="${padL - 6}" y="${y + 3}" text-anchor="end" font-size="9" fill="#94a3b8">${val >= 1000 ? (val / 1000).toFixed(0) + "k" : val}</text>`;
  }

  data.forEach((d, i) => {
    const barH = (d.value / max) * chartH;
    const x = padL + i * slotW + gap / 2;
    const y = padT + chartH - barH;
    const color = CHART_COLORS[i % CHART_COLORS.length];
    bars += `<rect x="${x}" y="${y}" width="${barW}" height="${barH}" fill="${color}" rx="3"/>`;
    bars += `<text x="${x + barW / 2}" y="${y - 4}" text-anchor="middle" font-size="9" fill="#334155" font-weight="600">${d.value >= 1000 ? (d.value / 1000).toFixed(1) + "k" : d.value}</text>`;
    labels += `<text x="${x + barW / 2}" y="${padT + chartH + 14}" text-anchor="middle" font-size="9" fill="#64748b">${escapeXml(String(d.label).substring(0, 12))}</text>`;
  });

  const axis = `<line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT + chartH}" stroke="#cbd5e1"/><line x1="${padL}" y1="${padT + chartH}" x2="${width - 15}" y2="${padT + chartH}" stroke="#cbd5e1"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="#ffffff"/>${yLabels}${axis}${bars}${labels}</svg>`;
}

export function pieChartSVG(data, width = 500, height = 240) {
  if (!data || data.length === 0) return "";
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const cx = 120;
  const cy = height / 2;
  const r = 85;

  let startAngle = -Math.PI / 2;
  let slices = "";

  data.forEach((d, i) => {
    const angle = (d.value / total) * 2 * Math.PI;
    const endAngle = startAngle + angle;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = angle > Math.PI ? 1 : 0;
    const color = CHART_COLORS[i % CHART_COLORS.length];

    if (angle >= 2 * Math.PI - 0.01) {
      slices += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}"/>`;
    } else {
      slices += `<path d="M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z" fill="${color}" stroke="#fff" stroke-width="1"/>`;
    }
    startAngle = endAngle;
  });

  let legend = "";
  data.forEach((d, i) => {
    const ly = 25 + i * 24;
    const color = CHART_COLORS[i % CHART_COLORS.length];
    const pct = ((d.value / total) * 100).toFixed(0);
    legend += `<rect x="250" y="${ly}" width="12" height="12" fill="${color}" rx="2"/>`;
    legend += `<text x="268" y="${ly + 10}" font-size="11" fill="#334155">${escapeXml(String(d.label).substring(0, 20))}</text>`;
    legend += `<text x="470" y="${ly + 10}" text-anchor="end" font-size="11" fill="#64748b">${pct}%</text>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="#ffffff"/>${slices}${legend}</svg>`;
}

export function lineChartSVG(data, width = 500, height = 240) {
  if (!data || data.length === 0) return "";
  const max = Math.max(...data.map((d) => d.value), 1);
  const padL = 50;
  const padB = 35;
  const padT = 15;
  const chartW = width - padL - 15;
  const chartH = height - padB - padT;
  const pointGap = chartW / Math.max(data.length - 1, 1);

  let pathD = "";
  let areaD = "";
  let points = "";
  let labels = "";
  let yLabels = "";

  for (let i = 0; i <= 4; i++) {
    const y = padT + chartH - (i / 4) * chartH;
    const val = Math.round((i / 4) * max);
    yLabels += `<line x1="${padL}" y1="${y}" x2="${width - 15}" y2="${y}" stroke="#e2e8f0" stroke-width="0.5"/>`;
    yLabels += `<text x="${padL - 6}" y="${y + 3}" text-anchor="end" font-size="9" fill="#94a3b8">${val >= 1000 ? (val / 1000).toFixed(0) + "k" : val}</text>`;
  }

  data.forEach((d, i) => {
    const x = padL + i * pointGap;
    const y = padT + chartH - (d.value / max) * chartH;
    if (i === 0) {
      pathD = `M ${x} ${y}`;
      areaD = `M ${x} ${padT + chartH} L ${x} ${y}`;
    } else {
      pathD += ` L ${x} ${y}`;
      areaD += ` L ${x} ${y}`;
    }
    points += `<circle cx="${x}" cy="${y}" r="3" fill="#2563eb"/>`;
    if (d.value > 0) {
      points += `<text x="${x}" y="${y - 6}" text-anchor="middle" font-size="8" fill="#334155">${d.value >= 1000 ? (d.value / 1000).toFixed(0) + "k" : d.value}</text>`;
    }
    labels += `<text x="${x}" y="${padT + chartH + 15}" text-anchor="middle" font-size="9" fill="#64748b">${d.label}</text>`;
  });
  areaD += ` L ${padL + (data.length - 1) * pointGap} ${padT + chartH} Z`;

  const axis = `<line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT + chartH}" stroke="#cbd5e1"/><line x1="${padL}" y1="${padT + chartH}" x2="${width - 15}" y2="${padT + chartH}" stroke="#cbd5e1"/>`;
  const area = `<path d="${areaD}" fill="#2563eb" opacity="0.12"/>`;
  const line = `<path d="${pathD}" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="#ffffff"/>${yLabels}${axis}${area}${line}${points}${labels}</svg>`;
}

export function renderChartSVG(chart) {
  if (chart.type === "bar") return barChartSVG(chart.data);
  if (chart.type === "pie") return pieChartSVG(chart.data);
  if (chart.type === "line") return lineChartSVG(chart.data);
  return "";
}

/**
 * Converts an SVG string to a PNG data URL via Image + canvas.
 */
export function svgToImage(svgString, width = 500, height = 240) {
  return new Promise((resolve) => {
    if (!svgString) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = width * 2;
        canvas.height = height * 2;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png"));
      } catch (e) {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    img.src = URL.createObjectURL(blob);
  });
}

/**
 * Builds a concise text summary of the data for AI prediction.
 */
export function summarizeData(data) {
  if (!data || data.length === 0) return "Aucune donnée disponible.";
  const sample = data[0];
  const keys = Object.keys(sample).filter((k) => !EXCLUDED_KEYS.includes(k));
  const lines = [`Total enregistrements: ${data.length}`];

  keys.forEach((k) => {
    if (typeof sample[k] === "number") {
      const sum = data.reduce((s, d) => s + (d[k] || 0), 0);
      const avg = sum / data.length;
      lines.push(`${k}: total ${sum.toLocaleString("fr-FR")}, moyenne ${avg.toFixed(0)}`);
    }
  });

  ["statut", "type", "categorie", "niveau", "gravite"].forEach((k) => {
    if (sample[k] !== undefined) {
      const map = {};
      data.forEach((d) => {
        const v = d[k] || "N/A";
        map[v] = (map[v] || 0) + 1;
      });
      const dist = Object.entries(map)
        .map(([k2, v]) => `${k2}: ${v}`)
        .join(", ");
      lines.push(`${k}: ${dist}`);
    }
  });

  const dateField = sample.date ? "date" : sample.date_debut ? "date_debut" : null;
  if (dateField) {
    const dates = data
      .map((d) => new Date(d[dateField]))
      .filter((d) => !isNaN(d.getTime()));
    if (dates.length > 0) {
      dates.sort((a, b) => a - b);
      lines.push(
        `Période: ${dates[0].toLocaleDateString("fr-FR")} au ${dates[dates.length - 1].toLocaleDateString("fr-FR")}`
      );
    }
  }

  return lines.join("\n");
}