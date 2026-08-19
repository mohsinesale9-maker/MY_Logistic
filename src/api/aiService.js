// Local AI service — tries Ollama (local LLM) first, then OpenAI, then
// a built-in rule-based prediction engine.  No API key needed for Ollama or
// the local prediction engine.
//
// To use Ollama:
//   1. Download from https://ollama.com
//   2. Run:  ollama serve
//   3. Pull a model:  ollama pull llama3.2
//   4. The app will automatically use it instead of OpenAI.
//
// To force OpenAI when Ollama is not available, set VITE_OPENAI_API_KEY.

const OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY || "";
const OLLAMA_URL = import.meta.env.VITE_OLLAMA_URL || "http://localhost:11434";

// ─── Ollama (local) ──────────────────────────────────────────────────────
async function ollamaChat(messages, model = "llama3.2") {
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, stream: false }),
  });
  if (!res.ok) throw new Error(`Ollama ${res.status}`);
  const json = await res.json();
  return json.message?.content || "";
}

async function isOllamaAvailable() {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, {
      signal: AbortSignal.timeout(2000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── OpenAI (cloud) ─────────────────────────────────────────────────────
async function openaiChat(messages) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.3,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI ${res.status}: ${text.slice(0, 200)}`);
  }
  const json = await res.json();
  return json.choices?.[0]?.message?.content || "";
}

// ─── Helpers (from eitherway-app data analyzer) ──────────────────────────
function parseNum(v) {
  if (v === null || v === undefined || v === '') return NaN;
  const cleaned = String(v).replace(/[$€£¥,\s%]/g, '');
  return Number(cleaned);
}

function formatNumber(n) {
  if (n === null || n === undefined || isNaN(n)) return '—';
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toFixed(2);
}

function normalize(val, min, max) {
  if (max === min) return 50;
  return Math.round(((val - min) / (max - min)) * 100);
}

// ─── Local analytics engine ──────────────────────────────────────────────
function localAnalytics(data, field) {
  const values = data.map((r) => r[field]).filter((v) => typeof v === "number" && isFinite(v));
  if (values.length === 0) return null;

  const sum = values.reduce((a, b) => a + b, 0);
  const avg = sum / values.length;
  const sorted = [...values].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const median = sorted[Math.floor(sorted.length / 2)];

  const variance = values.reduce((s, v) => s + (v - avg) ** 2, 0) / values.length;
  const std = Math.sqrt(variance);
  const anomalies = values.filter((v) => Math.abs(v - avg) > 2 * std).length;

  const topThreshold = sorted[Math.floor(sorted.length * 0.8)];
  const topCount = values.filter((v) => v >= topThreshold).length;

  return {
    avg: Math.round(avg),
    min: Math.round(min),
    max: Math.round(max),
    median: Math.round(median),
    stdDev: Math.round(std),
    anomalies,
    topCount,
    count: values.length,
  };
}

// ─── Local insight generator (rule-based AI) ──────────────────────────────
function localInsights(data, field) {
  const values = data.map((r) => r[field]).filter((v) => typeof v === "number" && isFinite(v));
  if (values.length < 2) return [];

  const sum = values.reduce((a, b) => a + b, 0);
  const avg = sum / values.length;
  const sorted = [...values].sort((a, b) => a - b);
  const variance = values.reduce((s, v) => s + (v - avg) ** 2, 0) / values.length;
  const std = Math.sqrt(variance);
  const insights = [];

  const max = sorted[sorted.length - 1];
  if (max > avg + 2 * std) {
    insights.push({
      type: "warning",
      text: `Valeur aberrante détectée (${Math.round(max)}) — ${Math.round((max / avg - 1) * 100)}% au-dessus de la moyenne.`,
    });
  }

  const half = Math.floor(values.length / 2);
  const avgFirst = values.slice(0, half).reduce((a, b) => a + b, 0) / (half || 1);
  const avgSecond = values.slice(half).reduce((a, b) => a + b, 0) / ((values.length - half) || 1);
  if (avgSecond > avgFirst * 1.1) {
    insights.push({
      type: "success",
      text: `Tendance haussière : +${Math.round((avgSecond / avgFirst - 1) * 100)}% sur la période récente.`,
    });
  } else if (avgSecond < avgFirst * 0.9) {
    insights.push({
      type: "warning",
      text: `Tendance baissière : ${Math.round((avgSecond / avgFirst - 1) * 100)}% sur la période récente.`,
    });
  }

  const last = values[values.length - 1];
  if (last < avg * 0.5) {
    insights.push({
      type: "danger",
      text: `Activité en forte baisse : dernière valeur (${Math.round(last)}) bien en dessous de la moyenne (${Math.round(avg)}).`,
    });
  }

  if (insights.length === 0) {
    insights.push({
      type: "info",
      text: "Aucune anomalie détectée. Les données sont stables et cohérentes.",
    });
  }

  return insights;
}

// ─── Anomaly detection (IQR-based, from eitherway-app) ───────────────────
function detectAnomalies(rows, columns) {
  const anomalies = [];
  columns
    .filter((c) => c.type === 'numeric' && c.stats)
    .forEach((col) => {
      const iqr = col.stats.q3 - col.stats.q1;
      const lower = col.stats.q1 - 1.5 * iqr;
      const upper = col.stats.q3 + 1.5 * iqr;
      let outlierCount = 0;

      rows.forEach((r) => {
        const v = parseNum(r[col.name]);
        if (!isNaN(v) && (v < lower || v > upper)) outlierCount++;
      });

      if (outlierCount > 0) {
        anomalies.push({
          column: col.name,
          outlierCount,
          pct: ((outlierCount / rows.length) * 100).toFixed(1),
          bounds: { lower: formatNumber(lower), upper: formatNumber(upper) },
        });
      }
    });
  return anomalies;
}

// ─── Data quality assessment (from eitherway-app) ────────────────────────
function assessDataQuality(rows, columns) {
  const totalCells = rows.length * columns.length;
  const missingCells = columns.reduce((sum, c) => sum + c.nullCount, 0);
  const completeness = (((totalCells - missingCells) / totalCells) * 100).toFixed(1);

  const duplicateCheck = new Set(rows.map((r) => JSON.stringify(r)));
  const duplicates = rows.length - duplicateCheck.size;

  return {
    completeness,
    duplicates,
    duplicatePct: ((duplicates / rows.length) * 100).toFixed(1),
    totalCells,
    missingCells,
    columnsWithIssues: columns.filter((c) => c.nullCount > 0).length,
    score: Math.max(0, Math.min(100,
      (parseFloat(completeness) * 0.6 + (100 - (duplicates / rows.length) * 100) * 0.4)
    )).toFixed(0),
  };
}

// ─── Column analysis (from eitherway-app) ────────────────────────────────
function analyzeColumns(rows, headers) {
  return headers.map((header) => {
    const values = rows.map((r) => r[header]).filter((v) => v !== null && v !== undefined && v !== '');
    const nullCount = rows.length - values.length;
    const uniqueValues = [...new Set(values.map(String))];

    const type = detectColumnType(values, header);
    const stats = type === 'numeric' ? computeNumericStats(values) : null;
    const topValues = type === 'categorical' ? getTopValues(values) : null;
    const dateRange = type === 'date' ? getDateRange(values) : null;

    return {
      name: header,
      type,
      nullCount,
      nullPct: ((nullCount / rows.length) * 100).toFixed(1),
      uniqueCount: uniqueValues.length,
      cardinality: uniqueValues.length / rows.length,
      stats,
      topValues,
      dateRange,
      sampleValues: values.slice(0, 5),
    };
  });
}

function detectColumnType(values, header) {
  if (values.length === 0) return 'unknown';

  const headerLower = header.toLowerCase();
  const dateKeywords = ['date', 'time', 'day', 'month', 'year', 'created', 'updated', 'timestamp', 'period', 'datetime'];
  if (dateKeywords.some((k) => headerLower.includes(k))) {
    const parsed = values.slice(0, 20).filter((v) => !isNaN(Date.parse(String(v))));
    if (parsed.length > values.slice(0, 20).length * 0.5) return 'date';
  }

  const numericCount = values.slice(0, 50).filter((v) => {
    const cleaned = String(v).replace(/[$€£¥,\s%]/g, '');
    return !isNaN(Number(cleaned)) && cleaned !== '';
  }).length;

  if (numericCount > values.slice(0, 50).length * 0.7) return 'numeric';

  const uniqueRatio = new Set(values.map(String)).size / values.length;
  if (uniqueRatio < 0.3 || new Set(values.map(String)).size <= 20) return 'categorical';

  return 'text';
}

function computeNumericStats(values) {
  const nums = values.map((v) => parseNum(v)).filter((n) => !isNaN(n));
  if (nums.length === 0) return null;

  const sorted = [...nums].sort((a, b) => a - b);
  const sum = nums.reduce((a, b) => a + b, 0);
  const mean = sum / nums.length;
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];
  const variance = nums.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / nums.length;
  const stdDev = Math.sqrt(variance);

  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    sum,
    mean,
    median,
    stdDev,
    q1: sorted[Math.floor(sorted.length * 0.25)],
    q3: sorted[Math.floor(sorted.length * 0.75)],
    count: nums.length,
  };
}

function getTopValues(values) {
  const counts = {};
  values.forEach((v) => {
    const key = String(v);
    counts[key] = (counts[key] || 0) + 1;
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([value, count]) => ({ value, count, pct: ((count / values.length) * 100).toFixed(1) }));
}

function getDateRange(values) {
  const dates = values.map((v) => new Date(String(v))).filter((d) => !isNaN(d.getTime()));
  if (dates.length === 0) return null;
  dates.sort((a, b) => a - b);
  return {
    min: dates[0].toISOString().split('T')[0],
    max: dates[dates.length - 1].toISOString().split('T')[0],
    span: dates.length,
  };
}

// ─── KPI generation (from eitherway-app, adapted for ERP) ───────────────
function generateERPInsights(rows, columns) {
  const insights = [];
  const numericCols = columns.filter((c) => c.type === 'numeric' && c.stats);
  const catCols = columns.filter((c) => c.type === 'categorical');

  insights.push({
    type: 'overview',
    severity: 'info',
    title: 'Aperçu des données',
    text: `Dataset de ${rows.length.toLocaleString()} enregistrements sur ${columns.length} colonnes. ${numericCols.length} champs numériques et ${catCols.length} champs catégoriques identifiés.`,
  });

  numericCols.forEach((col) => {
    const cv = col.stats.stdDev / Math.abs(col.stats.mean || 1);
    if (cv > 1) {
      insights.push({
        type: 'anomaly',
        severity: 'warning',
        title: `Haute variabilité — ${col.name}`,
        text: `"${col.name}" a un coefficient de variation de ${(cv * 100).toFixed(0)}%. Valeurs entre ${formatNumber(col.stats.min)} et ${formatNumber(col.stats.max)}. Envisagez d'investiguer les valeurs extrêmes.`,
      });
    }
  });

  const colsWithNulls = columns.filter((c) => c.nullCount > 0);
  if (colsWithNulls.length > 0) {
    const worstCol = [...colsWithNulls].sort((a, b) => b.nullCount - a.nullCount)[0];
    insights.push({
      type: 'quality',
      severity: 'warning',
      title: 'Données manquantes détectées',
      text: `${colsWithNulls.length} colonne(s) avec des valeurs manquantes. "${worstCol.name}" a ${worstCol.nullPct}% de données manquantes. Cela peut affecter la précision de l'analyse.`,
    });
  }

  if (numericCols.length > 0) {
    const main = numericCols[0];
    insights.push({
      type: 'trend',
      severity: 'info',
      title: `Distribution — ${main.name}`,
      text: `Moyenne: ${formatNumber(main.stats.mean)} | Médiane: ${formatNumber(main.stats.median)}. Distribution ${main.stats.mean > main.stats.median ? 'dissymétrique à droite' : 'dissymétrique à gauche'}.`,
    });
  }

  return insights;
}

// ─── Time-series forecast (from eitherway-app Forecasting.jsx) ───────────
function buildTimeSeries(rows, dateCol, numCol) {
  const byDate = {};
  rows.forEach((r) => {
    const d = new Date(String(r[dateCol]));
    if (isNaN(d.getTime())) return;
    const key = d.toISOString().split('T')[0];
    const val = parseNum(r[numCol]);
    if (!isNaN(val)) {
      if (!byDate[key]) byDate[key] = { sum: 0, count: 0 };
      byDate[key].sum += val;
      byDate[key].count++;
    }
  });
  return Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { sum }]) => ({ date, value: Math.round(sum * 100) / 100 }));
}

function computeForecast(series) {
  if (series.length < 5) return null;

  const windowSize = Math.min(7, Math.floor(series.length / 3));
  const lastValues = series.slice(-windowSize).map((d) => d.value);
  const avg = lastValues.reduce((a, b) => a + b, 0) / lastValues.length;

  const recentN = series.slice(-Math.min(30, series.length));
  const n = recentN.length;
  const sumX = recentN.reduce((s, _, i) => s + i, 0);
  const sumY = recentN.reduce((s, d) => s + d.value, 0);
  const sumXY = recentN.reduce((s, d, i) => s + i * d.value, 0);
  const sumX2 = recentN.reduce((s, _, i) => s + i * i, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  const lastDate = new Date(series[series.length - 1].date);
  const forecastPoints = [];
  for (let i = 1; i <= 14; i++) {
    const d = new Date(lastDate);
    d.setDate(d.getDate() + i);
    const predicted = intercept + slope * (n - 1 + i);
    forecastPoints.push({
      date: d.toISOString().split('T')[0],
      forecast: Math.max(0, Math.round(predicted * 100) / 100),
    });
  }

  const growth = series.length >= 2
    ? ((series[series.length - 1].value - series[0].value) / (series[0].value || 1) * 100)
    : 0;

  return {
    forecastData: forecastPoints,
    growthRate: Math.round(growth * 100) / 100,
    trend: slope > 0 ? 'up' : slope < 0 ? 'down' : 'flat',
    avgBaseline: Math.round(avg * 100) / 100,
    series,
  };
}

// ─── Full ERP data analysis (combines eitherway-app + existing logic) ───
function analyzeERPData(entityData) {
  // entityData = { [entityName]: rows[] }
  const allRows = Object.values(entityData).flat();
  if (allRows.length === 0) {
    return { error: "Aucune donnée disponible pour l'analyse." };
  }

  const headers = Object.keys(allRows[0] || {});
  const columns = analyzeColumns(allRows, headers);
  const numericCols = columns.filter((c) => c.type === 'numeric' && c.stats);
  const dateCols = columns.filter((c) => c.type === 'date');
  const catCols = columns.filter((c) => c.type === 'categorical');

  // KPIs
  const kpis = [];
  kpis.push({
    label: 'Enregistrements',
    value: allRows.length.toLocaleString(),
    color: 'accent',
  });

  if (numericCols.length > 0) {
    const primary = numericCols[0];
    kpis.push({
      label: `Total ${primary.name}`,
      value: formatNumber(primary.stats.sum),
      color: 'emerald',
    });
    kpis.push({
      label: `Moyenne ${primary.name}`,
      value: formatNumber(primary.stats.mean),
      color: 'cyan',
    });
  }

  if (catCols.length > 0) {
    const cat = catCols[0];
    kpis.push({
      label: `Catégories ${cat.name}`,
      value: cat.uniqueCount.toLocaleString(),
      color: 'amber',
    });
  }

  // Charts config
  const charts = [];

  if (catCols.length > 0 && numericCols.length > 0) {
    const cat = catCols[0];
    const num = numericCols[0];
    const groups = {};
    allRows.forEach((r) => {
      const key = String(r[cat.name] || 'Inconnu');
      const val = parseNum(r[num.name]);
      if (!isNaN(val)) groups[key] = (groups[key] || 0) + val;
    });
    const grouped = Object.entries(groups)
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 12);

    if (grouped.length > 0) {
      charts.push({
        type: 'bar',
        title: `${num.name} par ${cat.name}`,
        data: grouped,
        xKey: 'name',
        yKey: 'value',
        color: '#3B82F6',
      });
    }
  }

  if (catCols.length > 0) {
    const cat = catCols[0];
    if (cat.topValues?.length > 0) {
      charts.push({
        type: 'pie',
        title: `Distribution ${cat.name}`,
        data: cat.topValues.slice(0, 8).map((tv) => ({ name: tv.value, value: tv.count })),
        color: ['#3B82F6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'],
      });
    }
  }

  if (dateCols.length > 0 && numericCols.length > 0) {
    const series = buildTimeSeries(allRows, dateCols[0].name, numericCols[0].name);
    if (series.length > 1) {
      charts.push({
        type: 'line',
        title: `${numericCols[0].name} dans le temps`,
        data: series,
        xKey: 'date',
        yKey: 'value',
        color: '#06B6D4',
      });
    }
  }

  if (numericCols.length >= 2) {
    const scatter = allRows.slice(0, 100).map((r) => ({
      x: parseNum(r[numericCols[0].name]),
      y: parseNum(r[numericCols[1].name]),
    })).filter((d) => !isNaN(d.x) && !isNaN(d.y));

    if (scatter.length > 0) {
      charts.push({
        type: 'scatter',
        title: `${numericCols[0].name} vs ${numericCols[1].name}`,
        data: scatter,
        xKey: 'x',
        yKey: 'y',
        xLabel: numericCols[0].name,
        yLabel: numericCols[1].name,
        color: '#F59E0B',
      });
    }
  }

  // Forecast
  let forecast = null;
  if (dateCols.length > 0 && numericCols.length > 0) {
    const series = buildTimeSeries(allRows, dateCols[0].name, numericCols[0].name);
    forecast = computeForecast(series);
  }

  const insights = generateERPInsights(allRows, columns);
  const anomalies = detectAnomalies(allRows, columns);
  const quality = assessDataQuality(allRows, columns);

  return {
    rowCount: allRows.length,
    columnCount: headers.length,
    columns,
    kpis,
    charts,
    insights,
    anomalies,
    quality,
    forecast,
    entityCount: Object.keys(entityData).length,
    entities: Object.keys(entityData),
  };
}

// ─── Local prediction engine ─────────────────────────────────────────────
function localPredict(data, field, periodWeeks = 4) {
  const values = data.map((r) => r[field]).filter((v) => typeof v === "number" && isFinite(v));
  if (values.length < 2) return null;

  const window = values.slice(-periodWeeks);
  const avg = window.reduce((a, b) => a + b, 0) / window.length;

  const half = Math.floor(window.length / 2);
  const first = window.slice(0, half);
  const second = window.slice(half);
  const avgFirst = first.reduce((a, b) => a + b, 0) / (first.length || 1);
  const avgSecond = second.reduce((a, b) => a + b, 0) / (second.length || 1);
  const trend = (avgSecond - avgFirst) / (avgFirst || 1);

  return {
    forecast: Array.from({ length: 4 }, (_, i) => Math.round(avg * (1 + trend * (i + 1) * 0.5))),
    trend: Math.round(trend * 100),
    avg,
  };
}

// ─── Local offline chat engine (rule-based, no AI needed) ───────────────
function localERPChat(question, contextText) {
  const q = (question || "").toLowerCase();

  // Parse the context text to extract numbers
  const extract = (label) => {
    const regex = new RegExp(`${label}[^\\n]*?([\\d\\s.,]+(?:MAD|€|$|%|\\b))?`, "i");
    const match = contextText.match(regex);
    return match ? match[0].replace(label, "").trim() : null;
  };
  const extractNum = (label) => {
    const str = extract(label);
    if (!str) return null;
    const n = parseFloat(str.replace(/[^\d.,]/g, "").replace(",", "."));
    return isNaN(n) ? null : n;
  };

  const lines = contextText.split("\n").filter(Boolean);
  const sectionMap = {};
  let currentSection = "";
  lines.forEach((l) => {
    if (l.startsWith("===")) {
      currentSection = l.replace(/=/g, "").trim();
      sectionMap[currentSection] = [];
    } else if (currentSection) {
      sectionMap[currentSection].push(l);
    }
  });

  const get = (section, key) => {
    const rows = sectionMap[section] || [];
    const row = rows.find((r) => r.includes(key));
    return row || null;
  };

  // Detect intent
  const isSupplier = /fournisseur|perform|meilleur|fourni/i.test(q);
  const isTransport = /transport|cout|transport|dist|OTIF|livraison/i.test(q);
  const isStock = /stock|article|rupture|recommand|inventory|stockage/i.test(q);
  const isFinance = /finance|tresorie|cash|banque|caisse|resultat|marge|budget/i.test(q);
  const isRH = /employ|personnel|salaire|rh|effectif|absentei/i.test(q);
  const isFlotte = /flotte|vehicule|camion|disponibilit|pann|maintenance/i.test(q);
  const isCarburant = /carburant|essence|diesel|consommation|fuel/i.test(q);
  const isClient = /client|prospect|commande|vente|chiffre|ca|revenu/i.test(q);
  const isMaintenance = /maintenance|intervention|preventif|correctif|cout/i.test(q);
  const isExecutive = /resume|executif|synthese|rapport|conclusion/i.test(q);

  let response = "";

  // ── Supplier analysis ──
  if (isSupplier) {
    const section = sectionMap["=== FOURNISSEURS ==="] || [];
    const topLines = section.filter((l) => l.match(/^\s*\d/)).slice(0, 5);
    response = `## 📦 Classement des Fournisseurs\n\n`;
    if (topLines.length > 0) {
      response += `Voici le classement actuel basé sur le score composite (40% délai, 30% qualité, 20% prix, 10% réactivité) :\n\n`;
      topLines.forEach((l) => {
        response += `- ${l.trim()}\n`;
      });
    } else {
      response += `Aucune donnée fournisseur disponible dans le système.\n`;
    }
    response += `\n**Recommandation** : Priorisez les fournisseurs avec un score > 80/100 pour vos commandes critiques.`;
    return response;
  }

  // ── Transport analysis ──
  if (isTransport) {
    const section = sectionMap["=== TRANSPORT & EXPLOITATION ==="] || [];
    const otifMatch = section.join(" ").match(/OTIF[^:]*:\s*([\d.,]+)/);
    const costMatch = section.join(" ").match(/Coût transport total[^:]*:\s*([\d.,\s]+MAD]+)/);
    const distMatch = section.join(" ").match(/Distance totale[^:]*:\s*([\d.,\s]+km)/);
    const totalMatch = section.join(" ").match(/Total missions[^:]*:\s*(\d+)/);

    response = `## 🚚 Analyse Transport & Exploitation\n\n`;
    if (totalMatch) response += `- **Total missions** : ${totalMatch[1]}\n`;
    if (otifMatch) {
      const otif = parseFloat(otifMatch[1]);
      response += `- **Taux OTIF** : ${otis}% — ${otif >= 95 ? "✅ Excellent" : otif >= 85 ? "⚠️ Acceptable" : "❌ Critique"}\n`;
    }
    if (distMatch) response += `- **Distance totale** : ${distMatch[1].trim()}\n`;
    if (costMatch) response += `- **Coût transport** : ${costMatch[1].trim()}\n`;

    const fleetSection = sectionMap["=== FLOTTE ==="] || [];
    const dispoMatch = fleetSection.join(" ").match(/disponibilité[^:]*:\s*([\d.,]+)/);
    if (dispoMatch) {
      response += `- **Disponibilité flotte** : ${dispoMatch[1]}\n`;
    }

    const fuelSection = sectionMap["=== CARBURANT ==="] || [];
    const fuelCostMatch = fuelSection.join(" ").match(/Coût carburant[^:]*:\s*([\d.,\s]+MAD]+)/);
    if (fuelCostMatch) response += `- **Coût carburant** : ${fuelCostMatch[1].trim()}\n`;

    response += `\n**Recommandations** : Optimisez les tournées pour réduire le coût au km. Surveillez les véhicules avec une consommation anormale.`;
    return response;
  }

  // ── Stock / Inventory ──
  if (isStock) {
    const section = sectionMap["=== STOCKS & ARTICLES ==="] || [];
    const ruptMatch = section.join(" ").match(/rupture[^:]*:\s*(\d+)/);
    const lowMatch = section.join(" ").match(/seuil[^:]*:\s*(\d+)/);
    const valMatch = section.join(" ").match(/Valeur du stock[^:]*:\s*([\d.,\s]+MAD]+)/);

    response = `## 📦 Analyse des Stocks\n\n`;
    if (ruptMatch) {
      const n = parseInt(ruptMatch[1]);
      response += `- **Articles en rupture** : ${n} — ${n === 0 ? "✅ Aucun" : "🚨 Action immédiate requise"}\n`;
    }
    if (lowMatch) response += `- **Articles sous seuil** : ${lowMatch[1]}\n`;
    if (valMatch) response += `- **Valeur du stock** : ${valMatch[1].trim()}\n`;

    if (ruptMatch && parseInt(ruptMatch[1]) > 0) {
      response += `\n🚨 **Actions urgentes** :\n`;
      const ruptItems = section.find((l) => /en rupture/i.test(l));
      if (ruptItems) response += `- ${ruptItems.trim()}\n`;
      response += `- Passer immédiatement des commandes d'approvisionnement.\n`;
    } else {
      response += `\n✅ Le niveau de stock est satisfaisant. Surveillez les articles sous le seuil de réapprovisionnement.`;
    }
    return response;
  }

  // ── Finance ──
  if (isFinance) {
    const section = sectionMap["=== FINANCE ==="] || [];
    const resultMatch = section.join(" ").match(/Résultat net[^:]*:\s*([\d.,\s]+MAD]+)/);
    const margeMatch = section.join(" ").match(/Marge nette[^:]*:\s*([\d.,]+)/);
    const prodMatch = section.join(" ").match(/Produits[^:]*:\s*([\d.,\s]+MAD]+)/);
    const chargeMatch = section.join(" ").match(/Charges[^:]*:\s*([\d.,\s]+MAD]+)/);

    response = `## 💰 Analyse Financière\n\n`;
    if (prodMatch) response += `- **Produits** : ${prodMatch[1].trim()}\n`;
    if (chargeMatch) response += `- **Charges** : ${chargeMatch[1].trim()}\n`;
    if (resultMatch) {
      response += `- **Résultat net** : ${resultMatch[1].trim()}\n`;
    }
    if (margeMatch) {
      const m = parseFloat(margeMatch[1].replace(",", "."));
      response += `- **Marge nette** : ${margeMatch[1]}% — ${m >= 15 ? "✅ Bonne" : m >= 5 ? "⚠️ Faible" : "❌ Critique"}\n`;
    }

    const caMatch = (sectionMap["=== VENTES & CLIENTS ==="] || []).join(" ").match(/Chiffre d'affaires[^:]*:\s*([\d.,\s]+MAD]+)/);
    if (caMatch) response += `- **Chiffre d'affaires** : ${caMatch[1].trim()}\n`;

    response += `\n**Analyse** : ${resultMatch ? "Le résultat est " + (resultMatch[1].includes("-") ? "déficitaire" : "bénéficiaire") + "." : ""} Surveillez les charges et optimisez la marge.`;
    return response;
  }

  // ── RH ──
  if (isRH) {
    const section = sectionMap["=== RESSOURCES HUMAINES ==="] || [];
    const totalMatch = section.join(" ").match(/Total employ[Aé][^:]*:\s*(\d+)/);
    const actifMatch = section.join(" ").match(/Actifs[^:]*:\s*(\d+)/);
    const masseMatch = section.join(" ").match(/Masse salariale[^:]*:\s*([\d.,\s]+MAD]+)/);
    const absentMatch = section.join(" ").match(/absentéisme[^:]*:\s*([\d.,]+)/);

    response = `## 👥 Ressources Humaines\n\n`;
    if (totalMatch) response += `- **Total employés** : ${totalMatch[1]}\n`;
    if (actifMatch) response += `- **Actifs** : ${actifMatch[1]}\n`;
    if (masseMatch) response += `- **Masse salariale brute** : ${masseMatch[1].trim()}\n`;
    if (absentMatch) {
      const a = parseFloat(absentMatch[1].replace(",", "."));
      response += `- **Taux d'absentéisme** : ${absentMatch[1]}% — ${a <= 3 ? "✅ Normal" : "⚠️ Élevé"}\n`;
    }

    response += `\n**Recommandation** : Revoir la politique RH si l'absentéisme dépasse 5%.`;
    return response;
  }

  // ── Flotte ──
  if (isFlotte) {
    const section = sectionMap["=== FLOTTE ==="] || [];
    const totalMatch = section.join(" ").match(/Total véhicules[^:]*:\s*(\d+)/);
    const actifMatch = section.join(" ").match(/Actifs[^:]*:\s*(\d+)/);
    const dispoMatch = section.join(" ").match(/disponibilité[^:]*:\s*([\d.,]+)/);
    const panneMatch = section.join(" ").match(/panne[^:]*:\s*(\d+)/);

    response = `## 🚛 Analyse de la Flotte\n\n`;
    if (totalMatch) response += `- **Total véhicules** : ${totalMatch[1]}\n`;
    if (actifMatch) response += `- **Actifs** : ${actifMatch[1]}\n`;
    if (dispoMatch) {
      const d = parseFloat(dispoMatch[1].replace(",", "."));
      response += `- **Disponibilité** : ${dispoMatch[1]}% — ${d >= 90 ? "✅ Excellente" : d >= 75 ? "⚠️ Moyenne" : "❌ Critique"}\n`;
    }
    if (panneMatch) response += `- **En panne** : ${panneMatch[1]}\n`;

    const maintSection = sectionMap["=== MAINTENANCE ==="] || [];
    const coutMatch = maintSection.join(" ").match(/Coût total[^:]*:\s*([\d.,\s]+MAD]+)/);
    if (coutMatch) response += `- **Coût maintenance total** : ${coutMatch[1].trim()}\n`;

    response += `\n**Recommandation** : Privilégiez la maintenance préventive pour réduire les coûts et améliorer la disponibilité.`;
    return response;
  }

  // ── Carburant ──
  if (isCarburant) {
    const section = sectionMap["=== CARBURANT ==="] || [];
    const litresMatch = section.join(" ").match(/Litres consommés[^:]*:\s*([\d.,\s]+L]+)/);
    const costMatch = section.join(" ").match(/Coût carburant[^:]*:\s*([\d.,\s]+MAD]+)/);
    const anomalieMatch = section.join(" ").match(/Anomalies[^:]*:\s*(\d+)/);

    response = `## ⛽ Analyse Carburant\n\n`;
    if (litresMatch) response += `- **Litres consommés** : ${litresMatch[1].trim()}\n`;
    if (costMatch) response += `- **Coût carburant** : ${costMatch[1].trim()}\n`;
    if (anomalieMatch) {
      const n = parseInt(anomalieMatch[1]);
      response += `- **Anomalies de consommation** : ${n} — ${n === 0 ? "✅ Normal" : "🚨 Véhicules à contrôler"}\n`;
    }

    const fleetSection = sectionMap["=== FLOTTE ==="] || [];
    const vehCount = fleetSection.join(" ").match(/Total véhicules[^:]*:\s*(\d+)/);
    if (litresMatch && vehCount) {
      const litres = parseFloat(litresMatch[1].replace(/[^\d.,]/g, "").replace(",", "."));
      const count = parseInt(vehCount[1]);
      if (litres && count) {
        response += `- **Consommation moyenne/véhicule** : ${(litres / count).toFixed(0)} L\n`;
      }
    }

    response += `\n**Recommandation** : Analysez les consommations véhicule par véhicule pour détecter les anomalies.`;
    return response;
  }

  // ── Client / Ventes ──
  if (isClient) {
    const section = sectionMap["=== VENTES & CLIENTS ==="] || [];
    const caMatch = section.join(" ").match(/Chiffre d'affaires[^:]*:\s*([\d.,\s]+MAD]+)/);
    const cmdMatch = section.join(" ").match(/Total commandes[^:]*:\s*(\d+)/);
    const convMatch = section.join(" ").match(/conversion[^:]*:\s*([\d.,]+)/);
    const clientMatch = section.join(" ").match(/Clients[^:]*:\s*(\d+)/);
    const prospectMatch = section.join(" ").match(/Prospects[^:]*:\s*(\d+)/);

    response = `## 🏪 Analyse Ventes & Clients\n\n`;
    if (caMatch) response += `- **Chiffre d'affaires (livré)** : ${caMatch[1].trim()}\n`;
    if (cmdMatch) response += `- **Total commandes** : ${cmdMatch[1]}\n`;
    if (clientMatch) response += `- **Clients actifs** : ${clientMatch[1]}\n`;
    if (prospectMatch) response += `- **Prospects** : ${prospectMatch[1]}\n`;
    if (convMatch) {
      const c = parseFloat(convMatch[1].replace(",", "."));
      response += `- **Taux de conversion** : ${convMatch[1]}% — ${c >= 30 ? "✅ Bon" : c >= 15 ? "⚠️ Moyen" : "❌ Faible"}\n`;
    }

    response += `\n**Recommandation** : Renforcez le suivi des prospects pour améliorer le taux de conversion.`;
    return response;
  }

  // ── Maintenance ──
  if (isMaintenance) {
    const section = sectionMap["=== MAINTENANCE ==="] || [];
    const totalMatch = section.join(" ").match(/Total interventions[^:]*:\s*(\d+)/);
    const preventMatch = section.join(" ").match(/Préventives[^:]*:\s*(\d+)/);
    const correctMatch = section.join(" ").match(/Correctives[^:]*:\s*(\d+)/);
    const coutMatch = section.join(" ").match(/Coût total[^:]*:\s*([\d.,\s]+MAD]+)/);

    response = `## 🔧 Analyse Maintenance\n\n`;
    if (totalMatch) response += `- **Total interventions** : ${totalMatch[1]}\n`;
    if (preventMatch) response += `- **Préventives** : ${preventMatch[1]}\n`;
    if (correctMatch) response += `- **Correctives** : ${correctMatch[1]}\n`;
    if (coutMatch) response += `- **Coût total** : ${coutMatch[1].trim()}\n`;

    if (correctMatch && preventMatch) {
      const corr = parseInt(correctMatch[1]);
      const prev = parseInt(preventMatch[1]);
      const total = corr + prev;
      if (total > 0) {
        const ratio = (corr / total * 100).toFixed(0);
        response += `- **Ratio correctif/préventif** : ${ratio}% correctives\n`;
        response += `\n**Analyse** : ${ratio > 50 ? "⚠️ Trop d'interventions correctives. Renforcez la maintenance préventive." : "✅ Bon équilibre préventif/correctif."}\n`;
      }
    }
    return response;
  }

  // ── Executive summary ──
  if (isExecutive) {
    const stockSection = sectionMap["=== STOCKS & ARTICLES ==="] || [];
    const transportSection = sectionMap["=== TRANSPORT & EXPLOITATION ==="] || [];
    const financeSection = sectionMap["=== FINANCE ==="] || [];
    const fleetSection = sectionMap["=== FLOTTE ==="] || [];
    const rhSection = sectionMap["=== RESSOURCES HUMAINES ==="] || [];
    const salesSection = sectionMap["=== VENTES & CLIENTS ==="] || [];

    const lines = (arr) => arr.join("\n");

    const getVal = (arr, key) => {
      const m = arr.join(" ").match(new RegExp(`${key}[^:]*:\\s*([\\d.,\\sMAD%kmL]+)`));
      return m ? m[1].trim() : "—";
    };

    response = `## 📊 Résumé Exécutif — MY Logistics ERP\n\n`;
    response += `*Généré automatiquement depuis les données temps réel du système*\n\n`;
    response += `### 💰 Finance\n`;
    response += `- Résultat net : ${getVal(financeSection, "Résultat net")}\n`;
    response += `- Marge nette : ${getVal(financeSection, "Marge nette")}\n`;
    response += `- Chiffre d'affaires : ${getVal(salesSection, "Chiffre d'affaires")}\n\n`;

    response += `### 📦 Stocks & Approvisionnement\n`;
    response += `- Valeur du stock : ${getVal(stockSection, "Valeur du stock")}\n`;
    response += `- Articles en rupture : ${getVal(stockSection, "rupture")}\n`;
    response += `- Articles sous seuil : ${getVal(stockSection, "seuil")}\n\n`;

    response += `### 🚚 Transport & Flotte\n`;
    response += `- Taux OTIF : ${getVal(transportSection, "OTIF")}\n`;
    response += `- Disponibilité flotte : ${getVal(fleetSection, "disponibilité")}\n\n`;

    response += `### 👥 Ressources Humaines\n`;
    response += `- Effectif total : ${getVal(rhSection, "Total employ")}\n`;
    response += `- Taux d'absentéisme : ${getVal(rhSection, "absentéisme")}\n\n`;

    response += `### ⚡ Points d'Alerte\n`;
    const ruptN = parseInt(getVal(stockSection, "rupture")) || 0;
    const otifVal = parseFloat((getVal(transportSection, "OTIF") || "0").replace(",", ".")) || 0;
    const absentVal = parseFloat((getVal(rhSection, "absentéisme") || "0").replace(",", ".")) || 0;
    if (ruptN > 0) response += `- 🚨 **${ruptN} article(s) en rupture** — commander immédiatement\n`;
    if (otifVal < 85) response += `- ⚠️ **OTIF à ${otifVal}%** — optimizer les délais de livraison\n`;
    if (absentVal > 5) response += `- ⚠️ **Absentéisme à ${absentVal}%** — revoir la politique RH\n`;
    if (response.split("\n").length <= 8) response += `- ✅ Aucun point d'alerte critique détecté.\n`;

    return response;
  }

  // ── Default fallback ──
  return `## 🤖 Analyse MY Logistics ERP\n\nJe n'ai pas pu identifier le domaine de votre question avec certitude. Voici un aperçu rapide des données disponibles :\n\n${sectionMap["=== STOCKS & ARTICLES ==="] ? `📦 **Stocks** : ${sectionMap["=== STOCKS & ARTICLES ==="].find(l => l.includes("Total")) || "données disponibles"}\n` : ""}${sectionMap["=== FINANCE ==="] ? `💰 **Finance** : ${sectionMap["=== FINANCE ==="].find(l => l.includes("Résultat")) || "données disponibles"}\n` : ""}${sectionMap["=== TRANSPORT & EXPLOITATION ==="] ? `🚚 **Transport** : ${sectionMap["=== TRANSPORT & EXPLOITATION ==="].find(l => l.includes("OTIF")) || "données disponibles"}\n` : ""}${sectionMap["=== FLOTTE ==="] ? `🚛 **Flotte** : ${sectionMap["=== FLOTTE ==="].find(l => l.includes("Disponibilité")) || "données disponibles"}\n` : ""}\n\n**Conseils** : Reformulez votre question en incluant un mot-clé (ex: "fournisseurs", "stock", "finance", "transport", "RH").`;
}

// ─── Public API ───────────────────────────────────────────────────────────
export const aiService = {
  // 1) Chat — tries Ollama → OpenAI → friendly offline message
  async chat(prompt, { systemPrompt } = {}) {
    const messages = [
      ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
      { role: "user", content: prompt },
    ];

    if (await isOllamaAvailable()) {
      try {
        return await ollamaChat(messages);
      } catch (err) {
        console.warn("[ai] Ollama failed, falling back:", err.message);
      }
    }

    if (OPENAI_KEY) {
      try {
        return await openaiChat(messages);
      } catch (err) {
        console.warn("[ai] OpenAI failed:", err.message);
      }
    }

    // Extract the ERP context from the prompt to use with local engine
    const ctxMatch = prompt.match(/CONTEXTE ERP[^`]*`([^`]+)`/s);
    const contextText = ctxMatch ? ctxMatch[1].trim() : "";
    const questionMatch = prompt.match(/Question[^:]*:\s*"([^"]+)"/);
    const question = questionMatch ? questionMatch[1] : prompt.slice(0, 200);

    // Use the local rule-based ERP engine
    return localERPChat(question, contextText);
  },

  // 2) Full ERP data analysis — uses eitherway-app engine
  analyzeERPData(entityData) {
    return analyzeERPData(entityData);
  },

  // 3) Predictions — uses local engine when no AI available
  async predict({ data, field, periodWeeks = 4 }) {
    if (await isOllamaAvailable()) {
      try {
        const prompt = `Based on this data (field: ${field}), provide a JSON prediction with: summary (2-line summary), forecast (array of 4 predicted values), recommendations (array of 3 strings), risk_factors (array of 2 strings).\n\nData:\n${JSON.stringify(data.map(r => ({ [field]: r[field] })).slice(-10))}`;
        const result = await this.chat(prompt, {
          systemPrompt: "Tu es un assistant analytique. Réponds uniquement en JSON valide avec les clés: summary, forecast (4 nombres), recommendations (3 phrases), risk_factors (2 phrases).",
        });
        try {
          return JSON.parse(result);
        } catch { /* fall through */ }
      } catch { /* ignore */ }
    }

    const pred = localPredict(data, field, periodWeeks);
    if (!pred) {
      return {
        summary: "Données insuffisantes pour une prévision.",
        forecast: [],
        recommendations: ["Ajoutez plus de données pour activer les prévisions."],
        risk_factors: ["Pas assez de données historiques."],
      };
    }

    const trendLabel = pred.trend > 0 ? "📈" : pred.trend < 0 ? "📉" : "➡️";
    return {
      summary: `Prévision sur 4 périodes : tendance ${trendLabel} de ${pred.trend > 0 ? "+" : ""}${pred.trend}% par rapport à la moyenne historique (${pred.avg}).`,
      forecast: pred.forecast,
      recommendations: [
        pred.trend > 5 ? "La croissance soutenue justifie une augmentation des capacités." : "",
        pred.trend < -5 ? "Une baisse prolongée nécessite une analyse des causes." : "",
        "Surveillez les valeurs hebdomadaires pour affiner les prédictions.",
      ].filter(Boolean),
      risk_factors: [
        pred.trend > 20 ? "Croissance rapide potentiellement difficile à maintenir." : "",
        pred.trend < -20 ? "Déclin significatif risque d'impacter les opérations." : "",
        "Les prédictions sont basées sur les données disponibles.",
      ].filter(Boolean),
    };
  },

  // 4) Analytics — always local, no AI needed
  analyze({ data, field }) {
    return {
      stats: localAnalytics(data, field),
      insights: localInsights(data, field),
    };
  },
};

export default aiService;
