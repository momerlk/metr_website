import test from "node:test";
import assert from "node:assert/strict";
import { buildChartInput, chartToTable, compatibleProducts, parseChartCSV, type CatalogProduct, type SizeChartInput } from "../src/lib/console-catalog.ts";
import { consoleEndpoint, consoleListRequest, consolePagination } from "../src/lib/console.ts";

const metadata = { name: "Approved shirt chart", category: "tops", unit: "cm", basis: "body", verified: false } as const;
test("chart CSV supports BOM, quoted values, CRLF and ranges without executing formulas", () => {
  const table = parseChartCSV('\uFEFFsize,chest,shoulders\r\n"S","88-92",40\r\nM,94-98,42\r\n');
  const input = buildChartInput(metadata, table, { chest: "circumference", shoulders: "linear" });
  assert.equal(input.verified, false);
  assert.deepEqual(input.rows[0], { size: "S", measurements: { chest: { min: 88, max: 92 }, shoulders: { min: 40, max: 40 } } });
  assert.deepEqual(chartToTable(input), table);
  assert.equal(parseChartCSV('size,chest\n"S, regular",90').rows[0][0], "S, regular");
  assert.equal(parseChartCSV('size,chest\n"S"" regular",90').rows[0][0], 'S" regular');
  assert.throws(() => buildChartInput(metadata, parseChartCSV('size,chest\nS,=90+4'), { chest: "circumference" }), /number or range/);
});
test("malformed or oversized CSVs and unsupported columns fail before upload", () => {
  for (const csv of ["", 'size,chest\n"S,90', 'size,chest\n"S"extra,90', 'size,chest,chest\nS,90,90', 'size,__proto__\nS,90', 'name,chest\nS,90', 'size,chest\nS', 'size,chest\nS,90,extra', 'size,chest\n' + 'S,90\n'.repeat(31), 'size,chest\n' + 'a'.repeat(65536)]) assert.throws(() => parseChartCSV(csv));
});
test("measurement validation matches chart category, method, units and size ordering", () => {
  const table = parseChartCSV('size,chest\nS,44\nM,46');
  const garment = buildChartInput({ ...metadata, basis: "garment", verified: true }, table, { chest: "flat_width" });
  assert.equal(garment.verified, true);
  assert.equal(garment.rows[0].measurements.chest.min, 44, "flat width must not be silently converted before the API normalizes it");
  assert.throws(() => buildChartInput(metadata, table, { chest: "flat_width" }));
  assert.throws(() => buildChartInput({ ...metadata, category: "bottoms" }, table, { chest: "circumference" }));
  assert.throws(() => buildChartInput(metadata, table, { chest: "linear" }));
  for (const csv of ['size,chest\nS,90\ns,92', 'size,chest\nunknown,90', 'size,chest\nS,100\nM,90', 'size,chest\nS,94-90', 'size,chest\nS,0', 'size,chest\nS,301', 'size,chest\nS,Infinity']) assert.throws(() => buildChartInput(metadata, parseChartCSV(csv), { chest: "circumference" }));
  assert.throws(() => buildChartInput({ ...metadata, unit: "in", basis: "garment" }, parseChartCSV('size,chest\nS,60'), { chest: "flat_width" }));
  assert.throws(() => buildChartInput({ ...metadata, category: "footwear", basis: "garment" }, parseChartCSV('size,foot_length\n40,25'), { foot_length: "linear" }));
  assert.throws(() => buildChartInput(metadata, { columns: ['chest'], rows: [] }, { chest: 'circumference' }));
});
test("existing chart ranges and methods survive a review round trip", () => {
  const chart: SizeChartInput = { ...metadata, basis: "garment", measurements: [{ name: "chest", method: "flat_width" }], rows: [{ size: "S", measurements: { chest: { min: 44, max: 46 } } }] };
  assert.deepEqual(buildChartInput({ ...metadata, basis: 'garment' }, chartToTable(chart), { chest: "flat_width" }), chart);
});
test("chart assignment offers only matching product categories", () => {
  const products = [{ id: 'p1', product_type: 'shirt' }, { id: 'p2', product_type: 'jacket' }, { id: 'p3', product_type: 'trousers' }, { id: 'p4', product_type: 'unknown' }] as CatalogProduct[];
  const types = [{ id: 'shirt', label: 'Shirt', category: 'tops' }, { id: 'jacket', label: 'Jacket', category: 'tops' }, { id: 'trousers', label: 'Trousers', category: 'bottoms' }];
  assert.deepEqual(compatibleProducts(products, types, 'tops').map(product => product.id), ['p1', 'p2']);
  assert.deepEqual(compatibleProducts(products, types, 'footwear'), []);
});
test("catalog gateway allowlist limits routes, IDs, methods and pagination", () => {
  for (const [method, path] of [['GET','product-types'], ['GET','stores/sto_1/products'], ['GET','stores/sto_1/products/prd_1/variants'], ['GET','stores/sto_1/size-charts'], ['POST','stores/sto_1/size-charts'], ['PUT','stores/sto_1/size-charts/cht_1'], ['POST','stores/sto_1/size-charts/cht_1/products']]) assert.equal(consoleEndpoint(method,path.split('/')), '/v1/console/'+path);
  for (const [method,path] of [['POST','stores/sto_1/products'], ['PUT','stores/sto_1/products/prd_1'], ['DELETE','stores/sto_1/size-charts/cht_1'], ['GET','stores/../products'], ['POST','stores/sto_1/size-charts/../products'], ['GET','stores/sto_1/products/prd_1/variants/extra']]) assert.equal(consoleEndpoint(method,path.split('/')),null);
  assert.equal(consoleListRequest('GET',['stores','sto_1','products','prd_1','variants']),true);
  assert.equal(consoleListRequest('GET',['stores','sto_1','size-charts','cht_1']),false);
  assert.equal(consoleListRequest('POST',['stores','sto_1','size-charts','cht_1','products']),false);
  assert.equal(consolePagination(new URLSearchParams('limit=20&cursor=prd_1&merchant_id=other')), '?limit=20&cursor=prd_1');
  for (const query of ['limit=0','limit=101','limit=NaN','cursor=../private']) assert.throws(() => consolePagination(new URLSearchParams(query)));
});
