"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import ConsoleIcon from "@/components/console-icon";
import { consoleCall as call } from "@/lib/console-client";
import { shopifyRequestID, type Store, type ShopifyConnection } from "@/lib/console";
import { buildChartInput, chartAreas, chartCategories, chartFileLimit, chartRequired, chartToTable, circularAreas, compatibleProducts, label, parseChartCSV, type CatalogPage, type CatalogProduct, type CatalogVariant, type ChartCategory, type ChartMethod, type ChartTable, type ProductType, type SizeChart, type SizeChartInput } from "@/lib/console-catalog";

function failureMessage(error: unknown, mutation = false) {
  const failure = error as Error & { status?: number; requestID?: string };
  const message = mutation && (!failure.status || failure.status >= 500) ? "Could not confirm the changes. Refresh the list before trying again." : failure.message || "Could not load this data. Try again.";
  const requestID = shopifyRequestID(failure.requestID);
  return message + (requestID ? ` Request ID: ${requestID}` : "");
}
function pagePath(path: string, cursor?: string) { return path + "?" + new URLSearchParams({ limit: "20", ...(cursor ? { cursor } : {}) }); }
function appendPage<T extends { id: string }>(current: T[], page: T[]) { return [...new Map([...current, ...page].map(item => [item.id, item])).values()]; }

export default function ConsoleCatalog({ mode, stores, storeID, onStoreChange, connections, onBusyChange, onStores }: {
  mode: "catalog" | "charts"; stores: Store[]; storeID: string; onStoreChange: (id: string) => void;
  connections: Record<string, ShopifyConnection>; onBusyChange: (busy: boolean) => void; onStores: () => void;
}) {
  const selected = stores.find(store => store.id === storeID) || stores[0];
  const [working, setWorking] = useState(false);
  if (!selected) return <div className="console-list-panel console-empty"><span className="console-empty-icon"><ConsoleIcon name="stores" /></span><h2>Add a store first</h2><p>Your products, inventory and size charts are scoped to a store.</p><button onClick={onStores}>Open stores<ConsoleIcon name="arrow" /></button></div>;
  const connection = connections[selected.id];
  return <>
    <div className="console-catalog-controls"><label>Store<select value={selected.id} disabled={working} onChange={event => onStoreChange(event.target.value)}>{stores.map(store => <option key={store.id} value={store.id}>{store.name}</option>)}</select></label><p className="console-small">{connection?.last_sync_at ? `Last successful sync: ${new Date(connection.last_sync_at).toLocaleString()}.` : "No successful Shopify sync recorded."}<br />Availability reflects the stored catalog, not live stock quantities.</p></div>
    <StoreCatalog key={selected.id} mode={mode} storeID={selected.id} onBusyChange={value => { setWorking(value); onBusyChange(value); }} onStores={onStores} />
  </>;
}

function StoreCatalog({ mode, storeID, onBusyChange, onStores }: { mode: "catalog" | "charts"; storeID: string; onBusyChange: (busy: boolean) => void; onStores: () => void }) {
  const base = `stores/${storeID}`;
  const [products, setProducts] = useState<CatalogProduct[]>([]), [charts, setCharts] = useState<SizeChart[]>([]), [types, setTypes] = useState<ProductType[]>([]);
  const [productCursor, setProductCursor] = useState<string>(), [chartCursor, setChartCursor] = useState<string>();
  const [loading, setLoading] = useState(true), [moreLoading, setMoreLoading] = useState(false), [revision, setRevision] = useState(0);
  const [error, setError] = useState(""), [notice, setNotice] = useState("");
  const [editor, setEditor] = useState<SizeChart | "new" | null>(null), [assignment, setAssignment] = useState<SizeChart | null>(null);
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError("");
    Promise.all([call<CatalogPage<CatalogProduct>>(pagePath(`${base}/products`)), call<CatalogPage<SizeChart>>(pagePath(`${base}/size-charts`)), call<CatalogPage<ProductType>>("product-types")])
      .then(([productPage, chartPage, typePage]) => { if (!cancelled) { setProducts(productPage.data); setProductCursor(productPage.next_cursor); setCharts(chartPage.data); setChartCursor(chartPage.next_cursor); setTypes(typePage.data); } })
      .catch(err => { if (!cancelled) setError(failureMessage(err)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [base, revision]);
  async function loadMore(resource: "products" | "size-charts") {
    if (moreLoading) return;
    setMoreLoading(true); setError("");
    try {
      if (resource === "products") { const page = await call<CatalogPage<CatalogProduct>>(pagePath(`${base}/products`, productCursor)); setProducts(current => appendPage(current, page.data)); setProductCursor(page.next_cursor); }
      else { const page = await call<CatalogPage<SizeChart>>(pagePath(`${base}/size-charts`, chartCursor)); setCharts(current => appendPage(current, page.data)); setChartCursor(page.next_cursor); }
    } catch (err) { setError(failureMessage(err)); }
    finally { setMoreLoading(false); }
  }
  async function saveChart(input: SizeChartInput) {
    const existing = editor && editor !== "new" ? editor : null;
    const saved = await call<SizeChart>(`${base}/size-charts${existing ? `/${existing.id}` : ""}`, existing ? "PUT" : "POST", input);
    setCharts(current => existing ? current.map(chart => chart.id === saved.id ? saved : chart) : [saved, ...current]);
    setEditor(null); setError("");
    setNotice(`${saved.name} saved as ${saved.verified ? "verified" : "a draft"}. ${existing ? "All linked products use this chart." : "Choose the products that use these measurements."}`);
    if (!existing) setAssignment(saved);
  }
  async function assignProducts(ids: string[]) {
    if (!assignment) return;
    const result = await call<{ chart_id: string; products_updated: number }>(`${base}/size-charts/${assignment.id}/products`, "POST", { product_ids: ids });
    if (result.chart_id !== assignment.id || result.products_updated !== ids.length) throw new Error("Could not confirm the assignment.");
    const selected = new Set(ids);
    setProducts(current => current.map(product => selected.has(product.id) ? { ...product, size_chart_id: assignment.id } : product));
    setNotice(`${assignment.name} assigned to ${result.products_updated} products.${assignment.verified ? "" : " Verify the chart before using it for recommendations."}`);
    setAssignment(null); setError("");
  }
  return <>
    <div className="console-catalog-actions"><p>{mode === "catalog" ? "Open a product to see its sizes, colors and availability." : "Upload once. Reuse a chart across products in the same category."}</p><div className="console-actions"><button disabled={loading || moreLoading} onClick={() => { setNotice(""); setRevision(value => value + 1); }}>Refresh</button>{mode === "charts" && <button className="console-primary" disabled={loading || !!error} onClick={() => setEditor("new")}><ConsoleIcon name="plus" />Upload size chart</button>}</div></div>
    {error && <div className="console-alert console-error" role="alert"><p>{error}</p></div>}
    {notice && <div className="console-alert console-notice" role="status"><p>{notice}</p></div>}
    {loading ? <p role="status">Loading {mode === "catalog" ? "catalog" : "size charts"}…</p> : !error || products.length || charts.length ? mode === "catalog" ? <>
      <section className="console-list-panel" aria-label="Catalog products"><div className="console-list-toolbar"><h2>Products <span>{products.length}{productCursor ? "+" : ""}</span></h2><span className="console-small">Stored availability</span></div>
        {!products.length ? <div className="console-empty"><h3>No products imported yet</h3><p>Connect Shopify and select Sync catalog, or add products through your backend.</p><button onClick={onStores}>Open stores<ConsoleIcon name="arrow" /></button></div> : <div className="console-catalog-list">{products.map(product => <ProductInventory key={product.id} base={base} product={product} chart={charts.find(chart => chart.id === product.size_chart_id)} type={types.find(type => type.id === product.product_type)?.label || label(product.product_type)} />)}</div>}
      </section>
      {productCursor && <div className="console-pagination"><span>{products.length} products loaded</span><button disabled={moreLoading} onClick={() => void loadMore("products")}>{moreLoading ? "Loading…" : "Load more products"}</button></div>}
    </> : <>
      <section className="console-list-panel" aria-label="Size charts"><div className="console-list-toolbar"><h2>Size charts <span>{charts.length}{chartCursor ? "+" : ""}</span></h2><span className="console-small">Reusable across products</span></div>
        {!charts.length ? <div className="console-empty"><span className="console-empty-icon"><ConsoleIcon name="charts" /></span><h3>Add your first size chart</h3><p>Upload a CSV or enter measurements. Review the sizes, units and measurement methods before marking the chart as verified.</p><button onClick={() => setEditor("new")}>Upload a size chart<ConsoleIcon name="arrow" /></button></div> : <ul className="console-store-list">{charts.map(chart => <li key={chart.id}>
          <div className="console-store-heading"><span className="console-store-icon"><ConsoleIcon name="charts" /></span><div className="console-store-name"><h3>{chart.name}</h3><p>{chartCategories[chart.category]} · {chart.rows.length} sizes · {chart.unit} · {chart.basis} measurements</p></div><span className={`console-status${chart.verified ? "" : " console-status-warning"}`}>{chart.verified ? "Verified" : "Draft"}</span></div>
          <div className="console-store-detail"><p className="console-small">Sizes: {chart.rows.map(row => row.size).join(", ")}</p><p className="console-small">Assigned to {products.filter(product => product.size_chart_id === chart.id).length} of {products.length} loaded products{productCursor ? "; load more products to see other assignments" : ""}.</p><div className="console-store-footer"><code>Revision {chart.revision}</code><div className="console-actions"><button onClick={() => setEditor(chart)}>Review chart</button><button onClick={() => setAssignment(chart)}>Assign products</button></div></div></div>
        </li>)}</ul>}
      </section>
      {chartCursor && <div className="console-pagination"><span>{charts.length} charts loaded</span><button disabled={moreLoading} onClick={() => void loadMore("size-charts")}>{moreLoading ? "Loading…" : "Load more charts"}</button></div>}
    </> : null}
    {editor && <ChartEditor chart={editor === "new" ? undefined : editor} onClose={() => setEditor(null)} onSave={saveChart} onBusyChange={onBusyChange} />}
    {assignment && <ChartAssignment chart={assignment} products={compatibleProducts(products, types, assignment.category)} hasMore={!!productCursor} loading={moreLoading} loadMore={() => loadMore("products")} loadError={error} onClose={() => setAssignment(null)} onSave={assignProducts} onBusyChange={onBusyChange} />}
  </>;
}

function ProductInventory({ base, product, chart, type }: { base: string; product: CatalogProduct; chart?: SizeChart; type: string }) {
  const [open, setOpen] = useState(false), [loading, setLoading] = useState(false), [error, setError] = useState("");
  const [variants, setVariants] = useState<CatalogVariant[] | null>(null), [cursor, setCursor] = useState<string>();
  async function load(next?: string) {
    if (loading) return;
    setLoading(true); setError("");
    try { const page = await call<CatalogPage<CatalogVariant>>(pagePath(`${base}/products/${product.id}/variants`, next)); setVariants(current => next ? appendPage(current || [], page.data) : page.data); setCursor(page.next_cursor); }
    catch (err) { setError(failureMessage(err)); }
    finally { setLoading(false); }
  }
  return <details className="console-product" onToggle={event => { const expanded = event.currentTarget.open; setOpen(expanded); if (expanded && variants === null && !loading) void load(); }}>
    <summary><span className="console-store-icon"><ConsoleIcon name="catalog" /></span><span className="console-product-title"><strong>{product.title}</strong><span>{type} · {product.gender} · {label(product.garment_fit)} fit</span></span><span className={`console-status${product.size_chart_id ? "" : " console-status-warning"}`}>{product.size_chart_id ? chart ? chart.verified ? "Verified chart" : "Draft chart" : "Chart assigned" : "Needs chart"}</span><span className="console-product-toggle">{open ? "Hide" : "Inventory"} <span aria-hidden="true">⌄</span></span></summary>
    <div className="console-product-body"><p className="console-small">{chart ? `Size chart: ${chart.name}` : product.size_chart_id ? `Size chart: ${product.size_chart_id}` : "Assign a verified size chart in the Size charts tab."}<br />Stretch: {product.stretch}. Product ID: <code>{product.id}</code></p>
      {error && <p className="console-error" role="alert">{error} <button disabled={loading} onClick={() => void load(cursor)}>Retry</button></p>}
      {loading && <p role="status">Loading variants…</p>}
      {variants && !variants.length && !loading && <p>No variants are stored for this product.</p>}
      {!!variants?.length && <div className="console-table-scroll" tabIndex={0} role="region" aria-label={`Inventory for ${product.title}`}><table className="console-table"><caption>Stored variant availability. Quantities are not available.</caption><thead><tr><th scope="col">Size</th><th scope="col">Color</th><th scope="col">Availability</th><th scope="col">External ID</th></tr></thead><tbody>{variants.map(variant => <tr key={variant.id}><th scope="row">{variant.size}</th><td>{variant.color || "—"}</td><td><span className={`console-status${variant.available ? "" : " console-status-warning"}`}>{variant.available ? "Available" : "Unavailable"}</span></td><td><code>{variant.external_id}</code></td></tr>)}</tbody></table></div>}
      {cursor && <button disabled={loading} onClick={() => void load(cursor)}>Load more variants</button>}
    </div>
  </details>;
}

function ChartEditor({ chart, onClose, onSave, onBusyChange }: { chart?: SizeChart; onClose: () => void; onSave: (input: SizeChartInput) => Promise<void>; onBusyChange: (busy: boolean) => void }) {
  const dialog = useRef<HTMLDialogElement>(null), savingLock = useRef(false);
  const [name, setName] = useState(chart?.name || ""), [category, setCategory] = useState<ChartCategory>(chart?.category || "tops"), [unit, setUnit] = useState<"cm" | "in">(chart?.unit || "cm"), [basis, setBasis] = useState<"body" | "garment">(chart?.basis || "body");
  const [verified, setVerified] = useState(chart?.verified || false), [table, setTable] = useState<ChartTable>(chart ? chartToTable(chart) : { columns: ["chest"], rows: [] });
  const [methods, setMethods] = useState<Record<string, ChartMethod>>(chart ? Object.fromEntries(chart.measurements.map(value => [value.name, value.method])) : { chest: "circumference" });
  const [saving, setSaving] = useState(false), [reading, setReading] = useState(false), [error, setError] = useState("");
  useEffect(() => {
    const opener = document.activeElement;
    dialog.current?.showModal();
    return () => { if (opener instanceof HTMLElement && opener.isConnected) opener.focus(); };
  }, []);
  function setColumns(columns: string[]) {
    setTable(current => ({ columns, rows: current.rows.map(row => [row[0], ...columns.map(column => { const index = current.columns.indexOf(column); return index >= 0 ? row[index + 1] : ""; })]) }));
    setMethods(current => Object.fromEntries(columns.map(column => [column, current[column] || (circularAreas.includes(column) ? "circumference" : "linear")]))); setVerified(false);
  }
  async function upload(file?: File) {
    if (!file) return;
    setError(""); setReading(true);
    try {
      if (!/\.csv$/i.test(file.name) || file.size > chartFileLimit) throw new Error("Choose a CSV file smaller than 64 KiB.");
      const parsed = parseChartCSV(await file.text());
      setTable(parsed); setMethods(Object.fromEntries(parsed.columns.map(column => [column, circularAreas.includes(column) ? "circumference" : "linear"]))); setVerified(false);
      if (!name) setName(file.name.replace(/\.csv$/i, "").slice(0, 120));
    } catch (err) { setError((err as Error).message); }
    finally { setReading(false); }
  }
  async function submit(event: FormEvent) {
    event.preventDefault(); if (savingLock.current || reading) return;
    let input: SizeChartInput;
    try { input = buildChartInput({ name, category, unit, basis, verified, ...(chart?.brand ? { brand: chart.brand } : {}), ...(chart?.share_as_reference ? { share_as_reference: true } : {}) }, table, methods); }
    catch (err) { setError((err as Error).message); return; }
    savingLock.current = true; setSaving(true); onBusyChange(true); setError("");
    try { await onSave(input); } catch (err) { setError(failureMessage(err, true)); }
    finally { savingLock.current = false; setSaving(false); onBusyChange(false); }
  }
  const template = `size,${chartRequired[category].join(",")}\nS,${chartRequired[category].map(() => category === "footwear" ? unit === "cm" ? "24" : "9.5" : unit === "cm" ? "90-94" : "35-37").join(",")}\n`;
  return <dialog ref={dialog} className="console-dialog console-chart-dialog" aria-labelledby="chart-editor-title" onCancel={event => { if (saving || reading) event.preventDefault(); }} onClose={onClose}>
    <div className="console-dialog-heading"><div><span className="console-label">{chart ? `REVISION ${chart.revision}` : "REUSABLE SIZE CHART"}</span><h2 id="chart-editor-title">{chart ? "Review size chart" : "Upload size chart"}</h2></div><button className="console-icon-button" aria-label="Close chart editor" disabled={saving || reading} onClick={onClose}><ConsoleIcon name="close" /></button></div>
    <form onSubmit={submit}><fieldset disabled={saving || reading}>
      {chart && <p className="console-small">Saving updates every product linked to this chart. Changing measurements clears verification until you review them again.</p>}
      <div className="console-form-grid"><label>Chart name<input value={name} onChange={event => setName(event.target.value)} maxLength={120} required autoFocus /></label><label>Category<select value={category} disabled={!!chart} onChange={event => { const next = event.target.value as ChartCategory; setCategory(next); setVerified(false); if (!table.rows.length) setColumns(chartRequired[next]); if (next === "footwear") setBasis("body"); }}>{Object.entries(chartCategories).map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label><label>Units<select value={unit} onChange={event => { setUnit(event.target.value as "cm" | "in"); setVerified(false); }}><option value="cm">Centimeters (cm)</option><option value="in">Inches (in)</option></select></label><label>Measurements describe<select value={basis} onChange={event => { const value = event.target.value as "body" | "garment"; setBasis(value); setVerified(false); if (value === "body") setMethods(current => Object.fromEntries(Object.entries(current).map(([name, method]) => [name, method === "flat_width" ? "circumference" : method]))); }}><option value="body">Customer’s body</option><option value="garment" disabled={category === "footwear"}>Finished garment</option></select></label></div>
      <div className="console-upload"><label>Upload CSV<input type="file" accept=".csv,text/csv" onChange={event => { void upload(event.target.files?.[0]); event.target.value = ""; }} /></label><p className="console-small">Use size as the first column. Measurements can be single values or ranges (90-94). Up to 30 sizes; 64 KiB maximum. Review measurement methods below.</p><a className="console-inline-link" href={`data:text/csv;charset=utf-8,${encodeURIComponent(template)}`} download={`${category}-size-chart-template.csv`}>Download example CSV</a><p className="console-small">Template numbers are examples. Replace them with your approved measurements.</p></div>
      <div className="console-chart-table-heading"><h3>Review measurements</h3><label>Add measurement<select value="" onChange={event => { if (event.target.value) setColumns([...table.columns, event.target.value]); }}><option value="">Choose a column</option>{chartAreas[category].filter(area => !table.columns.includes(area)).map(area => <option key={area} value={area}>{label(area)}</option>)}</select></label></div>
      <p className="console-small">Keep sizes in order, smallest to largest. Size labels must exactly match the product’s variants. Changing units changes how values are interpreted; it does not convert them.</p>
      <div className="console-table-scroll" tabIndex={0} role="region" aria-label="Editable size measurements"><table className="console-table console-editable-table"><thead><tr><th scope="col">Size</th>{table.columns.map(column => <th scope="col" key={column}><span>{label(column)}</span><select aria-label={`${label(column)} measurement method`} value={methods[column]} onChange={event => { setMethods(current => ({ ...current, [column]: event.target.value as ChartMethod })); setVerified(false); }}>{circularAreas.includes(column) ? <><option value="circumference">Circumference</option>{basis === "garment" && <option value="flat_width">Flat width</option>}</> : <option value="linear">Length</option>}</select>{!chartRequired[category].includes(column) && <button type="button" onClick={() => setColumns(table.columns.filter(value => value !== column))} aria-label={`Remove ${label(column)} column`}>Remove</button>}</th>)}<th scope="col"><span className="console-small">Actions</span></th></tr></thead><tbody>{table.rows.map((row, index) => <tr key={index}>{row.map((value, cell) => <td key={cell}><input aria-label={cell === 0 ? `Size row ${index + 1}` : `${label(table.columns[cell - 1])} row ${index + 1}`} value={value} maxLength={32} required onChange={event => { setTable(current => ({ ...current, rows: current.rows.map((values, rowIndex) => rowIndex === index ? values.map((v, colIndex) => colIndex === cell ? event.target.value : v) : values) })); setVerified(false); }} /></td>)}<td><button type="button" aria-label={`Remove size row ${index + 1}`} onClick={() => { setTable(current => ({ ...current, rows: current.rows.filter((_, rowIndex) => rowIndex !== index) })); setVerified(false); }}><ConsoleIcon name="close" /></button></td></tr>)}</tbody></table></div>
      <button className="console-add-size" type="button" disabled={table.rows.length >= 30} onClick={() => { setTable(current => ({ ...current, rows: [...current.rows, ["", ...current.columns.map(() => "")]] })); setVerified(false); }}><ConsoleIcon name="plus" />Add size</button>
      <label className="console-checkbox"><input type="checkbox" checked={verified} onChange={event => setVerified(event.target.checked)} /><span>I have verified the sizes, measurements, units and methods for the products that will use this chart.</span></label>
      {!verified && <p className="console-small">Saved as a draft. Draft charts cannot enable recommendations.</p>}
      {error && <div className="console-alert console-error" role="alert"><p>{error}</p></div>}
      <div className="console-dialog-actions"><button type="button" onClick={onClose}>Cancel</button><button className="console-primary" disabled={saving || reading}>{saving ? "Saving…" : chart ? "Save chart" : "Save and assign products"}</button></div>
    </fieldset></form>
  </dialog>;
}

function ChartAssignment({ chart, products, hasMore, loading, loadMore, loadError, onClose, onSave, onBusyChange }: {
  chart: SizeChart; products: CatalogProduct[]; hasMore: boolean; loading: boolean; loadMore: () => Promise<void>; loadError: string;
  onClose: () => void; onSave: (ids: string[]) => Promise<void>; onBusyChange: (busy: boolean) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null), savingLock = useRef(false);
  const [selected, setSelected] = useState<Set<string>>(new Set()), [saving, setSaving] = useState(false), [error, setError] = useState("");
  useEffect(() => {
    const opener = document.activeElement;
    dialog.current?.showModal();
    return () => { if (opener instanceof HTMLElement && opener.isConnected) opener.focus(); };
  }, []);
  async function submit(event: FormEvent) {
    event.preventDefault(); if (savingLock.current || !selected.size) return;
    savingLock.current = true; setSaving(true); setError(""); onBusyChange(true);
    try { await onSave([...selected]); } catch (err) { setError(failureMessage(err, true)); }
    finally { savingLock.current = false; setSaving(false); onBusyChange(false); }
  }
  return <dialog ref={dialog} className="console-dialog console-assign-dialog" aria-labelledby="chart-assignment-title" onCancel={event => { if (saving) event.preventDefault(); }} onClose={onClose}>
    <div className="console-dialog-heading"><div><span className="console-label">{chartCategories[chart.category]}</span><h2 id="chart-assignment-title">Assign products</h2></div><button className="console-icon-button" disabled={saving} aria-label="Close product assignment" onClick={onClose}><ConsoleIcon name="close" /></button></div>
    <p>Use <strong>{chart.name}</strong> for the selected products. One chart can be reused across multiple products in this store.</p><p className="console-small">Only products in the same category are shown. Selecting a product replaces its current chart link; unselected products keep their links. Assign up to 100 products at a time.</p>
    <form onSubmit={submit}><fieldset disabled={saving}>
      <div className="console-product-picker">{products.map(product => <label className="console-checkbox" key={product.id}><input type="checkbox" checked={selected.has(product.id) || product.size_chart_id === chart.id} disabled={product.size_chart_id === chart.id || !selected.has(product.id) && selected.size >= 100} onChange={event => setSelected(current => { const next = new Set(current); if (event.target.checked) next.add(product.id); else next.delete(product.id); return next; })} /><span><strong>{product.title}</strong><small>{product.size_chart_id === chart.id ? "Already assigned" : product.size_chart_id ? "Replaces the current chart" : "No chart assigned"}</small></span></label>)}</div>
      {!products.length && <p>No matching products loaded. {hasMore ? "Load more products to find this category." : "Sync your catalog or choose a chart in another category."}</p>}
      {hasMore && <button type="button" disabled={loading} onClick={() => void loadMore()}>{loading ? "Loading…" : "Load more products"}</button>}
      {(error || loadError) && <div className="console-alert console-error" role="alert"><p>{error || loadError}</p></div>}
      <div className="console-dialog-actions"><button type="button" onClick={onClose}>Cancel</button><button className="console-primary" disabled={!selected.size || saving || loading}>{saving ? "Assigning…" : `Assign to ${selected.size} products`}</button></div>
    </fieldset></form>
  </dialog>;
}
