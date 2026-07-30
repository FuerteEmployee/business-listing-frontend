import * as XLSX from "xlsx";

/**
 * Single source of truth for the bulk-import spreadsheet format.
 *
 * Each column declares the header shown in the template, the payload key the
 * backend (`POST /api/admin/import`) expects, accepted header aliases for files
 * that were not produced from our own template, and a short note used both in
 * the generated Instructions sheet and in the on-screen format reference.
 */

const SHEET_NAMES = {
    instructions: "Instructions",
    categories: "Categories",
    users: "Users",
    listings: "Listings"
};

export const CATEGORY_COLUMNS = [
    { header: "Category Name", key: "name", required: true, note: "Unique category name. Matched case-insensitively against existing categories.", example: "Industrial Machinery" },
    { header: "URL Slug", key: "slug", note: "Leave blank to auto-generate from the name. Must be unique.", example: "industrial-machinery" },
    { header: "Parent Category", key: "parent", note: "Name of a parent category (may appear anywhere in this sheet). Blank = top level.", example: "" },
    { header: "Status", key: "status", note: "Active or Inactive. Default: Active.", example: "Active" },
    { header: "Image URL", key: "image", note: "Public https URL of the icon or banner (200x200px recommended). Files cannot be embedded in the sheet.", example: "" }
];

export const USER_COLUMNS = [
    { header: "Full Name", key: "name", required: true, note: "Display name of the user.", example: "Ramesh Patel" },
    { header: "Email Address", key: "email", required: true, note: "Unique login email. Also the key listings use to attach an owner.", example: "ramesh@shreeindustries.com" },
    { header: "Initial Password", key: "password", note: "Leave blank to auto-generate a strong password, returned once in the import result. Never changes an existing user's password.", example: "" },
    { header: "Mobile Number", key: "mobileNumber", note: "Must be unique across users. Format the column as Text to keep leading zeros.", example: "9876543210" },
    { header: "Access Tier", key: "role", note: "User, Merchant or Brand Owner. Default: User.", example: "Merchant" },
    { header: "Account Status", key: "status", note: "Active, Suspended, Banned or Unverified. Default: Active.", example: "Active" },
    { header: "Email Verified", key: "isEmailVerified", note: "Yes or No. Default: Yes.", example: "Yes" },
    { header: "Performance Score", key: "performanceScore", note: "Number 0-100. Default: 100.", example: "100" },
    { header: "Location", key: "location", note: "Free-text city or region for the user profile.", example: "Ahmedabad" },
    { header: "Profile Photo URL", key: "profilePhoto", note: "Public https URL.", example: "" },
    { header: "Admin Notes", key: "adminNotes", note: "Internal note, not shown to the user.", example: "" }
];

export const LISTING_COLUMNS = [
    { header: "Business Name", key: "name", required: true, aliases: ["companyname", "business", "company"], note: "Business name. A same-name listing in the same city is updated instead of duplicated.", example: "Shree Industries" },
    { header: "Primary Category", key: "category", required: true, aliases: ["categories", "product", "products", "service", "services", "industry", "facia", "facianame"], note: "Category name. Created automatically if it does not exist yet.", example: "Industrial Machinery" },
    { header: "Sub Category", key: "subCategory", note: "Free-text sub-category label.", example: "CNC Machines" },
    { header: "Tagline", key: "tagline", note: "Short strapline, max 100 characters.", example: "Precision engineering since 1998" },
    { header: "Description", key: "description", aliases: ["desc", "about", "details"], note: "Full business description.", example: "Manufacturer and exporter of CNC machines." },
    { header: "Owner Email", key: "ownerEmail", note: "Email of the assigned owner. Matched against the Users sheet first, then existing users. Created as a Merchant if unknown.", example: "ramesh@shreeindustries.com" },
    { header: "Owner Name", key: "ownerName", aliases: ["owner", "assignedowner", "assignedownername", "user", "merchant", "personname"], note: "Used only to look up an owner when Owner Email is blank. No account is created from a name alone.", example: "Ramesh Patel" },
    { header: "Country", key: "country", note: "Must already exist in the location master, otherwise left blank.", example: "India" },
    { header: "State", key: "state", note: "Must already exist under the country.", example: "Gujarat" },
    { header: "City", key: "city", aliases: ["town", "district"], note: "Must already exist under the state. Resolves the state automatically when the state cell is blank.", example: "Ahmedabad" },
    { header: "Area", key: "area", note: "Must already exist under the city.", example: "Naroda" },
    { header: "Address", key: "address", aliases: ["street", "addr"], note: "Street address.", example: "Plot 42, GIDC Estate" },
    { header: "Latitude", key: "latitude", note: "Decimal degrees, e.g. 23.0225. Needed for map and nearby search.", example: "23.0225" },
    { header: "Longitude", key: "longitude", note: "Decimal degrees, e.g. 72.5714.", example: "72.5714" },
    { header: "Phone", key: "phone", aliases: ["contact", "contactno", "mobile", "tel", "telephone", "phoneno"], note: "Primary contact number. Format the column as Text.", example: "9876543210" },
    { header: "Email", key: "email", aliases: ["mail", "emailaddress"], note: "Public business email.", example: "info@shreeindustries.com" },
    { header: "Website", key: "website", aliases: ["web", "url", "link"], note: "Full URL including https://.", example: "https://shreeindustries.com" },
    { header: "WhatsApp", key: "whatsapp", note: "WhatsApp number if different from Phone.", example: "9876543210" },
    { header: "Status", key: "status", note: "Pending, Approved, Rejected, Active, Inactive, Flagged or Suspended. Default: Active.", example: "Active" },
    { header: "Approval Stage", key: "approvalStage", note: "AwaitingReview, UnderReview, MoreInfoRequested, Approved or Rejected. Defaults to Approved for Active/Approved listings.", example: "Approved" },
    { header: "Plan", key: "plan", aliases: ["package", "subscription"], note: "Existing plan name. Left unassigned if not found.", example: "Free" },
    { header: "Verified", key: "verified", note: "Yes or No. Default: No.", example: "No" },
    { header: "Verification Status", key: "verificationStatus", note: "Verified, Not Verified, Pending Review or Flagged.", example: "Not Verified" },
    { header: "Business Badge", key: "businessBadgeVerified", note: "Yes or No - the blue tick. Default: No.", example: "No" },
    { header: "Featured", key: "isFeatured", note: "Yes or No. Default: No.", example: "No" },
    { header: "Manual Rank", key: "manualRank", note: "Number; higher values surface first. Default: 0.", example: "0" },
    { header: "Price Range", key: "priceRange", note: "$, $$, $$$ or $$$$. Default: $$.", example: "$$" },
    { header: "Tags", key: "tags", note: "Multiple values separated by | for example cnc|lathe|export.", example: "cnc|lathe|export" },
    { header: "Languages", key: "languages", note: "Separated by |.", example: "English|Hindi|Gujarati" },
    { header: "Payment Methods", key: "paymentMethods", note: "Separated by |.", example: "Cash|UPI|Bank Transfer" },
    { header: "GST/PAN", key: "gstPan", note: "Compliance number shown on the merchant profile.", example: "24AAAAA0000A1Z5" },
    { header: "Year Established", key: "yearEstablished", note: "Four-digit year between 1900 and next year.", example: "1998" },
    { header: "Employee Count", key: "employeeCount", note: "Whole number.", example: "45" },
    { header: "Service Radius (km)", key: "serviceRadius", note: "Service coverage radius in km. Default: 0.", example: "50" },
    { header: "Response Time (min)", key: "responseTime", note: "Typical enquiry response time in minutes. Default: 30.", example: "30" },
    { header: "Booking URL", key: "bookingUrl", note: "External booking or appointment link.", example: "" },
    { header: "Logo URL", key: "logo", note: "Public https URL of the logo.", example: "" },
    { header: "Cover Image URL", key: "image", note: "Public https URL of the main image. Defaults to the first gallery image.", example: "" },
    { header: "Gallery Image URLs", key: "galleryImages", note: "Multiple https URLs separated by |. The first becomes the cover.", example: "" },
    { header: "Facebook", key: "facebook", note: "Profile URL.", example: "" },
    { header: "Instagram", key: "instagram", note: "Profile URL.", example: "" },
    { header: "Twitter", key: "twitter", note: "Profile URL.", example: "" },
    { header: "LinkedIn", key: "linkedin", note: "Profile URL.", example: "" },
    { header: "YouTube", key: "youtube", note: "Channel URL.", example: "" },
    { header: "Hours Monday", key: "hours_monday", note: 'Format "09:00-18:00", or "Closed", or "24 Hours". Blank = not configured.', example: "09:00-18:00" },
    { header: "Hours Tuesday", key: "hours_tuesday", note: "Same format as Hours Monday.", example: "09:00-18:00" },
    { header: "Hours Wednesday", key: "hours_wednesday", note: "Same format as Hours Monday.", example: "09:00-18:00" },
    { header: "Hours Thursday", key: "hours_thursday", note: "Same format as Hours Monday.", example: "09:00-18:00" },
    { header: "Hours Friday", key: "hours_friday", note: "Same format as Hours Monday.", example: "09:00-18:00" },
    { header: "Hours Saturday", key: "hours_saturday", note: "Same format as Hours Monday.", example: "10:00-14:00" },
    { header: "Hours Sunday", key: "hours_sunday", note: "Same format as Hours Monday.", example: "Closed" }
];

export const IMPORT_SHEETS = [
    { name: SHEET_NAMES.categories, label: "Categories", columns: CATEGORY_COLUMNS, payloadKey: "categories", order: 1 },
    { name: SHEET_NAMES.users, label: "Users", columns: USER_COLUMNS, payloadKey: "users", order: 2 },
    { name: SHEET_NAMES.listings, label: "Listings", columns: LISTING_COLUMNS, payloadKey: "listings", order: 3 }
];

const normalizeHeader = (value) => (value === undefined || value === null ? "" : String(value))
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const cell = (value) => (value === undefined || value === null ? "" : String(value).trim());

/** Header label plus declared aliases, all normalized. */
const headerCandidates = (column) => [
    normalizeHeader(column.header),
    normalizeHeader(column.key),
    ...(column.aliases || [])
];

/**
 * Locate the header row in a raw sheet and map each declared column to its index.
 * Scans up to the first 20 rows so files with a title banner above the table still work.
 */
const detectHeaderRow = (rows, columns) => {
    const requiredKeys = columns.filter(c => c.required).map(c => c.key);
    const limit = Math.min(rows.length, 20);

    for (let r = 0; r < limit; r++) {
        const row = rows[r];
        if (!Array.isArray(row) || row.length === 0) continue;

        const normalized = row.map(normalizeHeader);
        const indices = {};
        for (const column of columns) {
            const candidates = headerCandidates(column);
            const idx = normalized.findIndex(value => value && candidates.includes(value));
            if (idx !== -1) indices[column.key] = idx;
        }

        if (requiredKeys.every(key => indices[key] !== undefined)) {
            return { headerRowIndex: r, indices, rawHeaders: row.map(cell) };
        }
    }
    return null;
};

const rowsFromSheet = (workbook, sheetName, columns) => {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) return { rows: [], detected: null };

    // blankrows must stay true so array indices line up with physical spreadsheet
    // rows - the row numbers we report are what the admin looks for in Excel.
    const raw = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "", blankrows: true });
    if (!raw.length) return { rows: [], detected: null };

    const detected = detectHeaderRow(raw, columns);
    if (!detected) return { rows: [], detected: null, rawFirstRow: raw.find(r => r.some(c => cell(c))) || [] };

    const requiredKeys = columns.filter(c => c.required).map(c => c.key);
    const rows = [];

    for (let i = detected.headerRowIndex + 1; i < raw.length; i++) {
        const row = raw[i];
        if (!Array.isArray(row) || row.every(c => cell(c) === "")) continue;

        const record = { __row: i + 1 };
        for (const column of columns) {
            const idx = detected.indices[column.key];
            record[column.key] = idx === undefined ? "" : cell(row[idx]);
        }
        // A row missing a required value is not data - most often a stray note under the table.
        if (requiredKeys.some(key => record[key] === "")) continue;
        rows.push(record);
    }

    return { rows, detected };
};

/** Case-insensitive sheet-name lookup so "listings" / "LISTINGS" both resolve. */
const resolveSheetName = (workbook, wanted) =>
    workbook.SheetNames.find(n => n.trim().toLowerCase() === wanted.toLowerCase()) || null;

/**
 * Parse an uploaded workbook into the payload shape `POST /api/admin/import` expects.
 *
 * Recognises a template workbook by its Categories / Users / Listings sheet names.
 * A workbook with none of those falls back to treating the first sheet as listings,
 * which keeps single-sheet files exported from other systems working.
 *
 * @returns {{payload: object, warnings: string[], usedSheets: string[]}}
 */
export const parseImportWorkbook = (arrayBuffer) => {
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: "array" });
    const payload = { categories: [], users: [], listings: [] };
    const warnings = [];
    const usedSheets = [];
    let matchedAnyNamedSheet = false;

    for (const sheet of IMPORT_SHEETS) {
        const actualName = resolveSheetName(workbook, sheet.name);
        if (!actualName) continue;
        matchedAnyNamedSheet = true;

        const { rows, detected, rawFirstRow } = rowsFromSheet(workbook, actualName, sheet.columns);
        if (!detected) {
            const required = sheet.columns.filter(c => c.required).map(c => `"${c.header}"`).join(" and ");
            const found = (rawFirstRow || []).map(h => `"${h}"`).join(", ");
            warnings.push(
                `Sheet "${actualName}" was skipped: could not find its required column${sheet.columns.filter(c => c.required).length > 1 ? "s" : ""} ${required}.`
                + (found ? ` Headers seen: [${found}]` : " The sheet looks empty.")
            );
            continue;
        }
        payload[sheet.payloadKey] = rows;
        if (rows.length) usedSheets.push(`${actualName} (${rows.length} row${rows.length === 1 ? "" : "s"})`);
        else warnings.push(`Sheet "${actualName}" has headers but no data rows.`);
    }

    if (!matchedAnyNamedSheet) {
        // Legacy / third-party single-sheet file: treat the first sheet as listings.
        const first = workbook.SheetNames[0];
        if (!first) {
            return { payload, warnings: ["The uploaded file contains no sheets."], usedSheets };
        }
        const { rows, detected, rawFirstRow } = rowsFromSheet(workbook, first, LISTING_COLUMNS);
        if (!detected) {
            const found = (rawFirstRow || []).map(h => `"${h}"`).join(", ");
            warnings.push(
                `No "Categories", "Users" or "Listings" sheet was found, and sheet "${first}" has no recognisable `
                + `"Business Name" and "Primary Category" columns.`
                + (found ? ` Headers seen: [${found}]` : "")
                + ` Download the template to see the expected format.`
            );
        } else {
            payload.listings = rows;
            if (rows.length) {
                usedSheets.push(`${first} (${rows.length} listing row${rows.length === 1 ? "" : "s"}, read as Listings)`);
            }
        }
    }

    return { payload, warnings, usedSheets };
};

const autoWidths = (columns, rows) => columns.map((column, idx) => {
    const longestValue = rows.reduce((max, row) => Math.max(max, String(row[idx] ?? "").length), 0);
    return { wch: Math.min(Math.max(column.header.length + 4, longestValue + 2, 12), 46) };
});

const buildSheet = (columns, exampleRows) => {
    const header = columns.map(c => (c.required ? `${c.header}*` : c.header));
    const data = [header, ...exampleRows];
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    worksheet["!cols"] = autoWidths(columns, exampleRows);
    worksheet["!freeze"] = { xSplit: 0, ySplit: 1 };
    return worksheet;
};

const buildInstructionsSheet = () => {
    const rows = [
        ["Business Listing Platform - Bulk Import Template"],
        [],
        ["How to use this workbook"],
        ["1.", "Fill the Categories, Users and Listings sheets. Every sheet is optional - import only the ones you need."],
        ["2.", "Do not rename the sheets or the header row. Columns may be reordered or deleted; only the starred ones are mandatory."],
        ["3.", "Sheets are processed in order: Categories, then Users, then Listings. A listing can therefore reference a category or owner defined in the same file."],
        ["4.", "Attach an owner to a listing with the Owner Email column, using the same email as the Users sheet."],
        ["5.", "Country, State, City, Area and Plan must already exist in the platform - unknown values are reported and left blank. Categories are created automatically."],
        ["6.", "Images cannot be embedded in a spreadsheet. Upload them first and paste the public https URL."],
        ["7.", "Multi-value cells (Tags, Languages, Payment Methods, Gallery Image URLs) use the pipe character | as separator."],
        ["8.", "Re-importing the same file updates matching rows instead of creating duplicates. Categories match on name, users on email, listings on name plus city."],
        ["9.", "Format phone, mobile and GST columns as Text in Excel so leading zeros are preserved."],
        ["10.", "Passwords of existing users are never changed by an import. Blank Initial Password generates a strong password, shown once in the import result."],
        [],
        ["Column reference"],
        ["Sheet", "Column", "Required", "Notes"]
    ];

    for (const sheet of IMPORT_SHEETS) {
        for (const column of sheet.columns) {
            rows.push([sheet.label, column.header, column.required ? "Yes" : "", column.note || ""]);
        }
        rows.push([]);
    }

    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    worksheet["!cols"] = [{ wch: 12 }, { wch: 24 }, { wch: 10 }, { wch: 110 }];
    return worksheet;
};

/**
 * Generate and download the three-sheet import template, pre-filled with one
 * example row per sheet that lines up with the Listings example.
 */
export const downloadImportTemplate = () => {
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, buildInstructionsSheet(), SHEET_NAMES.instructions);

    XLSX.utils.book_append_sheet(workbook, buildSheet(CATEGORY_COLUMNS, [
        CATEGORY_COLUMNS.map(c => c.example ?? ""),
        ["CNC Machines", "cnc-machines", "Industrial Machinery", "Active", ""]
    ]), SHEET_NAMES.categories);

    XLSX.utils.book_append_sheet(workbook, buildSheet(USER_COLUMNS, [
        USER_COLUMNS.map(c => c.example ?? "")
    ]), SHEET_NAMES.users);

    XLSX.utils.book_append_sheet(workbook, buildSheet(LISTING_COLUMNS, [
        LISTING_COLUMNS.map(c => c.example ?? "")
    ]), SHEET_NAMES.listings);

    XLSX.writeFile(workbook, "business-listing-import-template.xlsx");
};
