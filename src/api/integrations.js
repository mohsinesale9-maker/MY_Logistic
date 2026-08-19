// Integrations layer — file upload, data extraction, LLM calls.
//   - UploadFile: stores a file as a data URL so we never need a real
//     storage bucket to demo the app.
//   - ExtractDataFromUploadedFile: parses CSV / Excel / JSON in the browser
//     and shapes the rows against the entity's JSON-schema.
//   - InvokeLLM: routes through aiService (Ollama → OpenAI → local fallback).

import { aiService } from "./aiService";

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // 4MB cap for the in-browser upload path

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Lecture du fichier impossible"));
    reader.readAsDataURL(file);
  });
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Lecture du fichier impossible"));
    reader.readAsText(file);
  });
}

function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Lecture du fichier impossible"));
    reader.readAsArrayBuffer(file);
  });
}

function isLikelyCsv(name) {
  return /\.csv$/i.test(name || "");
}
function isLikelyJson(name) {
  return /\.json$/i.test(name || "");
}
function isLikelyExcel(name) {
  return /\.(xlsx|xls)$/i.test(name || "");
}

// Try to coerce a string cell to a number when the schema expects one.
function coerce(value, type) {
  if (value === "" || value === null || value === undefined) return null;
  if (type === "number") {
    const n = Number(String(value).replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  if (type === "boolean") {
    if (typeof value === "boolean") return value;
    const s = String(value).toLowerCase();
    return s === "true" || s === "1" || s === "oui" || s === "yes";
  }
  if (type === "string") return String(value);
  return value;
}

// Lightweight CSV parser that handles quoted fields with embedded commas / newlines.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ",") {
        row.push(field);
        field = "";
      } else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else {
        field += c;
      }
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.length > 0 && r.some((c) => c !== ""));
}

async function parseSpreadsheet(file) {
  // xlsx is already a project dependency — use it when present.
  try {
    const mod = await import(/* @vite-ignore */ "xlsx");
    const XLSX = mod.default || mod;
    const buf = await readFileAsArrayBuffer(file);
    const wb = XLSX.read(buf, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sheet, { defval: "" });
  } catch (err) {
    throw new Error(
      "Lecture Excel indisponible. Installez le paquet `xlsx` ou exportez en CSV."
    );
  }
}

async function loadFileFromUrl(fileUrl) {
  // Data URL: decode to a Blob so we can re-parse it.
  if (typeof fileUrl === "string" && fileUrl.startsWith("data:")) {
    const res = await fetch(fileUrl);
    const blob = await res.blob();
    const name = fileUrl.match(/^data:([^;]+);/i)?.[1] || "file";
    return new File([blob], `pasted.${name.includes("csv") ? "csv" : "file"}`, {
      type: blob.type,
    });
  }
  if (typeof fileUrl === "string" && /^https?:/.test(fileUrl)) {
    const res = await fetch(fileUrl);
    const blob = await res.blob();
    const name = fileUrl.split("/").pop() || "file";
    return new File([blob], name, { type: blob.type });
  }
  if (fileUrl instanceof File) return fileUrl;
  throw new Error("URL de fichier non reconnue");
}

function applyJsonSchema(rows, schema) {
  if (!schema || !schema.properties) return rows;
  const props = schema.properties;

  // Build a reverse map: for each schema key, store all its case/underscore variants
  // e.g. "vehiculeMatricule" → ["vehiculeMatricule","vehicule_matricule","vehicule-matricule","vehiculematricule"]
  const schemaKeyVariants = {};
  Object.keys(props).forEach((k) => {
    schemaKeyVariants[k] = [
      k,
      k.toLowerCase(),
      k.replace(/([A-Z])/g, "_$1").toLowerCase(), // camelCase → snake_case
      k.replace(/([A-Z])/g, "_$1").toLowerCase().replace(/^_/, ""),
      k.replace(/([A-Z])/g, "-$1").toLowerCase(),  // camelCase → kebab-case
    ];
  });

  return rows.map((row) => {
    const out = {};
    // Normalize row keys to lowercase for matching
    const rowLower = {};
    Object.keys(row).forEach((rk) => { rowLower[rk.toLowerCase()] = rk; });

    Object.entries(props).forEach(([key, def]) => {
      // Direct match
      if (row[key] !== undefined && row[key] !== "") {
        out[key] = coerce(row[key], def.type);
        return;
      }
      // Try variants
      const variants = schemaKeyVariants[key] || [];
      for (const v of variants) {
        const rowKey = rowLower[v];
        if (rowKey !== undefined && row[rowKey] !== "" && row[rowKey] !== null) {
          out[key] = coerce(row[rowKey], def.type);
          return;
        }
      }
    });
    return out;
  });
}

const EXTRACTION_PLACEHOLDER = `Aucun fournisseur d'IA n'est configuré. Ajoutez \`VITE_OPENAI_API_KEY\` dans \`.env.local\` pour activer l'extraction automatique, ou remplissez votre fichier avec un en-tête qui correspond aux champs attendus.`;

export const integrations = {
  Core: {
    async UploadFile({ file }) {
      if (!file) throw new Error("Aucun fichier fourni");
      if (file.size > MAX_UPLOAD_BYTES) {
        throw new Error(
          `Fichier trop volumineux (max ${(MAX_UPLOAD_BYTES / 1024 / 1024).toFixed(
            1
          )} Mo). Connectez un bucket Supabase Storage pour des fichiers plus gros.`
        );
      }
      const dataUrl = await readFileAsDataURL(file);
      return { file_url: dataUrl, file_size: file.size, file_type: file.type };
    },

    async ExtractDataFromUploadedFile({ file_url, json_schema }) {
      try {
        const file = await loadFileFromUrl(file_url);
        let rows = [];
        if (isLikelyJson(file.name)) {
          const txt = await readFileAsText(file);
          const parsed = JSON.parse(txt);
          rows = Array.isArray(parsed) ? parsed : [parsed];
        } else if (isLikelyCsv(file.name)) {
          const txt = await readFileAsText(file);
          const matrix = parseCsv(txt);
          if (matrix.length === 0) {
            return { status: "error", details: "Fichier CSV vide." };
          }
          const [header, ...data] = matrix;
          rows = data.map((r) =>
            Object.fromEntries(header.map((h, i) => [h.trim(), r[i] ?? ""]))
          );
        } else if (isLikelyExcel(file.name)) {
          rows = await parseSpreadsheet(file);
        } else {
          return {
            status: "error",
            details: `Format non supporté (${file.name}). Utilisez CSV, Excel ou JSON.`,
          };
        }

        const shaped = applyJsonSchema(rows, json_schema);
        const cleanRows = shaped.filter(
          (r) => Object.values(r).some((v) => v !== null && v !== "")
        );

        if (cleanRows.length === 0) {
          return {
            status: "error",
            details: EXTRACTION_PLACEHOLDER,
          };
        }

        return { status: "success", output: cleanRows };
      } catch (err) {
        return { status: "error", details: err.message || "Extraction échouée" };
      }
    },

    async InvokeLLM({ prompt, add_context_from_internet, response_json_schema }) {
      // Use the aiService: tries Ollama → OpenAI → local prediction engine.
      const SYSTEM_PROMPT = "Tu es un assistant ERP qui aide à analyser des données d'entreprise. Réponds en français sauf indication contraire.";

      try {
        const response = await aiService.chat(prompt, { systemPrompt: SYSTEM_PROMPT });

        if (response_json_schema) {
          try {
            return JSON.parse(response);
          } catch {
            return { raw: response };
          }
        }
        return response;
      } catch (err) {
        console.warn("[InvokeLLM] aiService failed:", err.message);
        // Fallback so the UI never breaks.
        return response_json_schema
          ? {
              summary: "Service IA temporairement indisponible.",
              forecast: [],
              recommendations: ["Vérifiez la connexion à Ollama ou OpenAI."],
              risk_factors: ["Aucune analyse disponible."],
            }
          : "### Service IA indisponible pour le moment.\n\nVérifiez qu'Ollama est en cours d'exécution ou qu'une clé OpenAI est configurée.";
      }
    },
  },
};

export default integrations;
