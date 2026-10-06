/**
 * Read search keywords out of an uploaded Excel / CSV file for a single listing.
 *
 * Accepted layouts:
 *  - A column headed Keywords / Keyword / Tags / Tag / Search Keywords (in the first 20 rows);
 *    only that column is read.
 *  - No such header: every non-empty cell of the sheet is treated as keyword text.
 * Each cell may hold several keywords separated by | , ; or line breaks.
 *
 * xlsx is loaded on demand so pages that never upload a file don't pay for it.
 */

const KEYWORD_HEADERS = ["keywords", "keyword", "tags", "tag", "searchkeywords", "searchtags", "businesskeywords"];

const normalizeHeader = (value) => String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

const splitKeywords = (value) => String(value ?? "")
    .split(/[|,;\n\r]+/)
    .map(k => k.trim())
    .filter(Boolean);

/** Prefer a sheet named Keywords (e.g. the bulk-import template), else the first sheet. */
const pickSheetName = (workbook) =>
    workbook.SheetNames.find(n => n.trim().toLowerCase() === "keywords") || workbook.SheetNames[0];

/**
 * @param {File} file
 * @returns {Promise<string[]>} keywords in file order, de-duplicated case-insensitively
 */
export const parseKeywordFile = async (file) => {
    const XLSX = await import("xlsx");
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(buffer), { type: "array" });
    const sheetName = pickSheetName(workbook);
    if (!sheetName) return [];

    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: "" });

    let headerRow = -1;
    let column = -1;
    for (let r = 0; r < Math.min(rows.length, 20) && column === -1; r++) {
        const idx = (rows[r] || []).findIndex(c => KEYWORD_HEADERS.includes(normalizeHeader(c)));
        if (idx !== -1) {
            headerRow = r;
            column = idx;
        }
    }

    const cells = column === -1
        ? rows.flat()
        : rows.slice(headerRow + 1).map(row => (row || [])[column]);

    const seen = new Set();
    const keywords = [];
    for (const keyword of cells.flatMap(splitKeywords)) {
        const key = keyword.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        keywords.push(keyword);
    }
    return keywords;
};

/** Download a one-column sample file showing the expected format. */
export const downloadKeywordSample = async () => {
    const XLSX = await import("xlsx");
    const worksheet = XLSX.utils.aoa_to_sheet([
        ["Keywords"],
        ["cnc machine"],
        ["lathe machine"],
        ["metal cutting bandsaw"],
        ["industrial machinery|machine manufacturer"]
    ]);
    worksheet["!cols"] = [{ wch: 44 }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Keywords");
    XLSX.writeFile(workbook, "keywords-sample.xlsx");
};
