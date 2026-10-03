export type CatalogPage<T> = { data: T[]; next_cursor?: string };
export type CatalogProduct = { id: string; store_id: string; title: string; external_id: string; product_type: string; gender: string; garment_fit: string; stretch: string; size_chart_id?: string };
export type CatalogVariant = { id: string; external_id: string; size: string; color?: string; available: boolean };
export type ProductType = { id: string; label: string; category: string };
export type ChartCategory = "tops" | "bottoms" | "one_piece" | "footwear";
export type ChartMethod = "circumference" | "flat_width" | "linear";
export type ChartMeasurement = { name: string; method: ChartMethod };
export type SizeChartInput = {
  name: string; category: ChartCategory; unit: "cm" | "in"; basis: "body" | "garment"; verified: boolean;
  brand?: string; share_as_reference?: boolean;
  measurements: ChartMeasurement[];
  rows: { size: string; measurements: Record<string, { min: number; max: number }> }[];
};
export type SizeChart = SizeChartInput & { id: string; store_id: string; revision: number };
export type ChartTable = { columns: string[]; rows: string[][] };
export const chartCategories: Record<ChartCategory, string> = { tops: "Tops", bottoms: "Bottoms", one_piece: "Dresses & one-piece", footwear: "Footwear" };
export const chartAreas: Record<ChartCategory, string[]> = {
  tops: ["chest", "shoulders", "waist", "length", "sleeve"],
  bottoms: ["waist", "hips", "thigh", "inseam", "rise", "length"],
  one_piece: ["chest", "waist", "hips", "shoulders", "length", "inseam", "sleeve"], footwear: ["foot_length"],
};
export const chartRequired: Record<ChartCategory, string[]> = { tops: ["chest"], bottoms: ["waist", "hips"], one_piece: ["chest", "waist", "hips"], footwear: ["foot_length"] };
export const circularAreas = ["chest", "waist", "hips", "thigh"];
export const chartFileLimit = 64 * 1024;
export const label = (value: string) => value.replaceAll("_", " ");

// CSV cells may be quoted, including escaped quotes. Numeric cells are validated
// separately; uploading a file never executes a spreadsheet formula.
export function parseChartCSV(text: string): ChartTable {
  if (new TextEncoder().encode(text).length > chartFileLimit) throw new Error("Use a CSV file smaller than 64 KiB.");
  const records: string[][] = []; let row: string[] = [], cell = "", quoted = false, closed = false;
  text = text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  for (let i = 0; i <= text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === undefined) throw new Error("The CSV has an unclosed quoted cell.");
      if (char === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else { quoted = false; closed = true; } }
      else cell += char;
    } else if (char === "," || char === "\n" || char === undefined) {
      row.push(cell.trim()); cell = ""; closed = false;
      if (char !== ",") { if (row.some(value => value !== "")) records.push(row); row = []; }
    } else if (char === '"') {
      if (cell || closed) throw new Error("A CSV quote must start at the beginning of a cell.");
      quoted = true;
    } else {
      if (closed && char.trim()) throw new Error("Unexpected text after a quoted CSV cell.");
      if (!closed) cell += char;
    }
  }
  const header = records.shift()?.map(value => value.toLowerCase().replaceAll(" ", "_"));
  if (!header || header[0] !== "size" || header.length < 2) throw new Error("The CSV must start with size, followed by measurement names such as chest or waist.");
  const columns = header.slice(1), allowed = new Set(Object.values(chartAreas).flat());
  if (new Set(columns).size !== columns.length || columns.some(name => !allowed.has(name))) throw new Error("Use unique supported measurement columns. Download a template for the selected category.");
  if (!records.length || records.length > 30 || records.some(row => row.length !== header.length)) throw new Error("Provide 1–30 size rows with a value for every column.");
  return { columns, rows: records };
}
export function chartToTable(chart: SizeChartInput): ChartTable {
  const columns = chart.measurements.map(value => value.name);
  return { columns, rows: chart.rows.map(row => [row.size, ...columns.map(name => { const { min, max } = row.measurements[name]; return min === max ? String(min) : `${min}-${max}`; })]) };
}
export function buildChartInput(metadata: Omit<SizeChartInput, "rows" | "measurements">, table: ChartTable, methods: Record<string, ChartMethod>): SizeChartInput {
  const { category, unit, basis } = metadata;
  if (!metadata.name.trim() || metadata.name.trim().length > 120 || /[\x00-\x1f\x7f]/.test(metadata.name)) throw new Error("Enter a chart name of 1–120 characters.");
  if (!Object.hasOwn(chartAreas, category) || !["cm", "in"].includes(unit) || !["body", "garment"].includes(basis)) throw new Error("Choose a supported category, unit and measurement basis.");
  if (category === "footwear" && basis !== "body") throw new Error("Footwear charts must use body foot length.");
  if (table.columns.length < 1 || table.columns.length > 8 || new Set(table.columns).size !== table.columns.length || table.columns.some(name => !chartAreas[category].includes(name))) throw new Error("The measurement columns must match the chart category.");
  for (const required of chartRequired[category]) if (!table.columns.includes(required)) throw new Error(`${chartCategories[category]} charts require ${label(required)}.`);
  if (!table.rows.length || table.rows.length > 30) throw new Error("Add 1–30 sizes, ordered smallest to largest.");
  const measurements = table.columns.map(name => {
    const method = methods[name];
    if (circularAreas.includes(name) ? !["circumference", "flat_width"].includes(method) || basis === "body" && method === "flat_width" : method !== "linear") throw new Error(`Choose a valid measurement method for ${label(name)}.`);
    return { name, method };
  });
  const seen = new Set<string>(), previous: Record<string, number> = {};
  const rows = table.rows.map((row, rowIndex) => {
    const size = row[0]?.trim();
    if (!size || size.length > 32 || /[\x00-\x1f\x7f]/.test(size) || size.toLowerCase() === "unknown" || seen.has(size.toLowerCase())) throw new Error(`Row ${rowIndex + 1}: use a unique size label of 1–32 characters.`);
    seen.add(size.toLowerCase());
    if (row.length !== table.columns.length + 1) throw new Error(`Row ${rowIndex + 1}: provide every measurement.`);
    const values: Record<string, { min: number; max: number }> = {};
    measurements.forEach(({ name, method }, index) => {
      const match = /^(\d+(?:\.\d+)?)(?:\s*[-–]\s*(\d+(?:\.\d+)?))?$/.exec(row[index + 1].trim());
      if (!match) throw new Error(`Row ${rowIndex + 1}, ${label(name)}: enter a number or range such as 90-94.`);
      const min = Number(match[1]), max = Number(match[2] || match[1]);
      const factor = (unit === "in" ? 2.54 : 1) * (method === "flat_width" ? 2 : 1);
      if (!Number.isFinite(min) || !Number.isFinite(max) || min <= 0 || max < min || max * factor > 300) throw new Error(`Row ${rowIndex + 1}, ${label(name)}: use a positive range up to 300 cm after conversion.`);
      const midpoint = (min + max) / 2;
      if (chartRequired[category].includes(name) && midpoint < (previous[name] || 0)) throw new Error(`Order sizes smallest to largest by ${label(name)}.`);
      previous[name] = midpoint;
      values[name] = { min, max };
    });
    return { size, measurements: values };
  });
  return { ...metadata, name: metadata.name.trim(), measurements, rows };
}
export function compatibleProducts(products: CatalogProduct[], types: ProductType[], category: ChartCategory): CatalogProduct[] {
  const allowed = new Set(types.filter(type => type.category === category).map(type => type.id));
  return products.filter(product => allowed.has(product.product_type));
}
