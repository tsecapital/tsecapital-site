// Tiny zero-dependency CSV reader/writer (RFC-4180-ish): handles quoted fields,
// embedded commas, quotes, and newlines. Good enough for this lead list; not a
// general-purpose CSV library.

const fs = require("fs");

// Parse CSV text → { headers: string[], rows: Array<Record<string,string>> }
function parse(text) {
  const records = [];
  let field = "";
  let record = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];

    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++; // escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }

    if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      record.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      // Finish the record on a newline. Swallow \r\n as one break.
      if (c === "\r" && text[i + 1] === "\n") i++;
      record.push(field);
      field = "";
      records.push(record);
      record = [];
    } else {
      field += c;
    }
  }
  // Trailing field/record (file not ending in newline).
  if (field.length > 0 || record.length > 0) {
    record.push(field);
    records.push(record);
  }

  const nonEmpty = records.filter(
    (r) => !(r.length === 1 && r[0].trim() === "")
  );
  if (nonEmpty.length === 0) return { headers: [], rows: [] };

  const headers = nonEmpty[0];
  const rows = nonEmpty.slice(1).map((r) => {
    const obj = {};
    headers.forEach((h, idx) => (obj[h] = r[idx] ?? ""));
    return obj;
  });
  return { headers, rows };
}

function readFile(path) {
  if (!fs.existsSync(path)) return { headers: [], rows: [] };
  return parse(fs.readFileSync(path, "utf8"));
}

// Quote a single field if it contains comma, quote, or newline.
function escapeField(value) {
  const s = value == null ? "" : String(value);
  if (/[",\n\r]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

// Serialize { headers, rows } back to CSV text.
function stringify(headers, rows) {
  const lines = [headers.map(escapeField).join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escapeField(row[h])).join(","));
  }
  return lines.join("\n") + "\n";
}

function writeFile(path, headers, rows) {
  fs.writeFileSync(path, stringify(headers, rows));
}

module.exports = { parse, readFile, stringify, writeFile };
