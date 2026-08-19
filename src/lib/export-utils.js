export function exportToCSV(filename, headers, rows) {
  const escapeCSV = (value) => {
    if (value === null || value === undefined) return "";
    const str = String(value);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvContent = [
    headers.map(escapeCSV).join(","),
    ...rows.map((row) => row.map(escapeCSV).join(",")),
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function exportEntityToCSV(entityLabel, fields, data) {
  const headers = fields.map((f) => f.label);
  const rows = data.map((item) =>
    fields.map((f) => {
      const val = item[f.key];
      if (typeof val === "number") return val;
      return val || "";
    })
  );
  exportToCSV(entityLabel, headers, rows);
}