"use client";
import Link from "next/link";
import { consoleCall as call } from "@/lib/console-client";
import ConsoleCatalog from "@/components/console-catalog";
import ConsoleIcon from "@/components/console-icon";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { shopifySyncAction, shopifySyncMessage, shopifySyncFailure, preserveShopifySync, shopifyCallbackErrors, shopifyAppLaunch, shopifyRequestID, type Seller, type Store, type APIKey, type ShopifyConnection, type ShopifySyncResult } from "@/lib/console";

export default function SellerConsole() {
  const [seller, setSeller] = useState<Seller | null>(null), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("signup"), [tab, setTab] = useState<"stores" | "catalog" | "charts" | "keys" | "guide">("stores");
  const [stores, setStores] = useState<Store[]>([]), [keys, setKeys] = useState<APIKey[]>([]), [connections, setConnections] = useState<Record<string, ShopifyConnection>>({});
  const [error, setError] = useState(""), [notice, setNotice] = useState(""), [secret, setSecret] = useState("");
  const [launchShop, setLaunchShop] = useState<string | null>(null);
  const [selectedStoreID, setSelectedStoreID] = useState("");
  const [requestID, setRequestID] = useState<string | undefined>();
  const syncLock = useRef(false);
  const [syncingStore, setSyncingStore] = useState<string | null>(null), [retryStore, setRetryStore] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [formKind, setFormKind] = useState<"store" | "key" | null>(null);
  const [helpOpen, setHelpOpen] = useState(true);
  useEffect(() => { if (formKind) { setError(""); setRequestID(undefined); dialog.current?.showModal(); } else dialog.current?.close(); }, [formKind]);
  const [catalogStoreID, setCatalogStoreID] = useState("");
  const [kind, setKind] = useState("custom");
  async function refresh() {
    const account = await call<Seller>("me"); setSeller(account);
    const [storeList, keyList] = await Promise.all([call<{ data: Store[]; next_cursor?: string }>("stores?limit=100"), call<{ data: APIKey[]; next_cursor?: string }>("api-keys?limit=100")]);
    setStores(storeList.data); setKeys(keyList.data);
    if (storeList.next_cursor || keyList.next_cursor) setNotice("Showing the first 100 stores and keys. Additional records remain accessible through the API.");
    const shopifyStores = storeList.data.filter(store => /^https:\/\/[a-z0-9][a-z0-9-]*\.myshopify\.com\/?$/.test(store.domain));
    const statuses = await Promise.allSettled(shopifyStores.map(store => call<ShopifyConnection>(`stores/${store.id}/shopify`)));
    setConnections(previous => Object.fromEntries(shopifyStores.map((store, i) => {
      const status = statuses[i];
      return [store.id, preserveShopifySync(previous[store.id], status.status === "fulfilled" ? status.value : { store_id: store.id, status: "unknown" as const })];
    })));
  }
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const result = params.get("connection");
    setRequestID(shopifyRequestID(params.get("request_id")));
    if (result && Object.hasOwn(shopifyCallbackErrors, result)) setError(shopifyCallbackErrors[result]);
    const launched = shopifyAppLaunch(params);
    const query = window.location.search.slice(1);
    if (params.has("shop") || params.has("code") || params.has("state") || params.has("hmac") || params.has("connection") || params.has("request_id")) window.history.replaceState(null, "", window.location.pathname);
    const launchCheck = call<{ shop: string | null }>("shopify/launch", launched ? "POST" : "GET", launched ? { query } : undefined)
      .then(pending => {
        setLaunchShop(pending.shop);
        if (pending.shop) setNotice(`Shopify verified ${pending.shop}. Select the Metr store you want to link after signing in. This launch has not authorized a connection.`);
      }).catch(err => { setLaunchShop(null); setSelectedStoreID(""); if (launched || result === "launch_verified" || err.code === "invalid_launch") { setError(err.message); setRequestID(err.requestID); } });
    if (result === "authorized") setNotice("Shopify returned to the console. Check your store’s authorization status below. Select Sync catalog to import products. The storefront widget is still pending.");
    if (result === "failed") setError("Shopify authorization could not finish. Start a new connection from this console. If it fails again, check the backend connection configuration.");
    if (result === "sign_in") setNotice("Sign in, then start your Shopify connection again.");
    const accountCheck = refresh().catch(err => { if (err.status !== 401) { setError(err.message); setRequestID(err.requestID); } });
    void Promise.all([launchCheck, accountCheck]).finally(() => setLoading(false));
  }, []);
  async function run(action: () => Promise<void>) {
    if (busy) return; setBusy(true); setError(""); setRequestID(undefined);
    try { await action(); } catch (err) { const failure = err as Error & { status?: number; code?: string; requestID?: string }; if (failure.code === "invalid_launch") { setLaunchShop(null); setSelectedStoreID(""); } setRequestID(failure.requestID); if (failure.status === 401 && seller) { setSeller(null); setSecret(""); setStores([]); setKeys([]); setConnections({}); } setError(failure.message); } finally { setBusy(false); }
  }
  function authenticate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const values = new FormData(form);
    void run(async () => { await call(mode, "POST", { email: values.get("email"), password: values.get("password"), ...(mode === "signup" ? { company: values.get("company") } : {}) }); form.reset(); await refresh(); });
  }
  function createStore(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const values = new FormData(form);
    void run(async () => { await call("stores", "POST", { name: values.get("name"), domain: values.get("domain") }); form.reset(); await refresh(); setFormKind(null); setNotice("Store created. Authorize Shopify or create an API key to continue."); });
  }
  function createKey(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const values = new FormData(event.currentTarget);
    void run(async () => { setSecret(""); const issued = await call<{ secret: string }>("api-keys", "POST", { name: values.get("name"), store_id: values.get("store"), scopes: values.getAll("scopes") }); setSecret(issued.secret); setFormKind(null); await refresh(); });
  }
  async function connect(store: Store) {
    await run(async () => { const result = await call<{ authorization_url: string }>(`stores/${store.id}/shopify/start`, "POST", {}); const url = new URL(result.authorization_url); if (url.protocol !== "https:" || !/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(url.hostname) || url.pathname !== "/admin/oauth/authorize") throw new Error("Invalid Shopify authorization address."); window.location.assign(url.href); });
  }
  async function syncCatalog(store: Store) {
    if (busy || syncLock.current) return;
    syncLock.current = true;
    setSyncingStore(store.id);
    await run(async () => {
      setNotice(""); setRetryStore(null);
      try {
        const result = await call<ShopifySyncResult>(`stores/${store.id}/shopify/sync`, "POST", {});
        setNotice(shopifySyncMessage(result));
      } catch (err) {
        setError(shopifySyncFailure(err));
        setRequestID(shopifyRequestID((err as { requestID?: string }).requestID));
        setRetryStore(store.id);
      }
      try {
        const connection = await call<ShopifyConnection>(`stores/${store.id}/shopify`);
        setConnections(previous => ({ ...previous, [store.id]: preserveShopifySync(previous[store.id], connection) }));
      } catch {
        setConnections(previous => ({ ...previous, [store.id]: preserveShopifySync(previous[store.id], { store_id: store.id, status: "unknown" }) }));
      }
    });
    setSyncingStore(null); syncLock.current = false;
  }
  const selectedStore = stores.find(store => store.id === selectedStoreID);
  const errorDetails = requestID ? <p className="console-small">Request ID: <code>{requestID}</code></p> : null;
  if (loading) return <section className="console-wrap" aria-busy="true"><h1>Seller console</h1><p>Loading your workspace…</p></section>;
  if (!seller) return <section className="console-wrap console-auth">
    <div className="console-intro"><span className="console-label">Metr Fit / seller console</span><h1>Your store.<br />A better fit.</h1><p>Create your account, register a store, and manage access to the Metr Fit API.</p><ul className="console-benefits"><li>Use Shopify authorization to connect your store.</li><li>Build a custom integration with store-scoped API keys.</li><li>Keep each store’s catalog and sizing sessions separate.</li></ul><Link href="/docs">Read the integration guide →</Link></div>
    <div className="console-auth-form"><div className="console-switch" role="group" aria-label="Account action"><button type="button" aria-pressed={mode === "signup"} disabled={busy} onClick={() => { setMode("signup"); setError(""); }}>Create account</button><button type="button" aria-pressed={mode === "login"} disabled={busy} onClick={() => { setMode("login"); setError(""); }}>Sign in</button></div><h2>{mode === "signup" ? "Create your workspace" : "Welcome back"}</h2><p>{mode === "signup" ? "Start with your business details. Add a store after signing up." : "Sign in with the email you used to create your workspace."}</p><form onSubmit={authenticate}><fieldset disabled={busy}>
      {mode === "signup" && <label>Company name<input name="company" autoComplete="organization" maxLength={120} required /></label>}
      <label>Email<input name="email" type="email" autoComplete="email" maxLength={254} required /></label>
      <label>Password<input name="password" type="password" minLength={12} maxLength={72} autoComplete={mode === "signup" ? "new-password" : "current-password"} required aria-describedby="password-help" /></label><p id="password-help" className="console-small">Use 12 or more characters. Maximum 72 bytes.</p>
      <button className="console-primary" type="submit">{busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}</button>
    </fieldset></form><p className="console-error" role="alert">{error}</p>{errorDetails}<p role="status">{notice}</p><p className="console-small">Email verification and self-service password recovery are not available in this initial version.</p></div>
  </section>;
  const titles = { stores: "Stores", catalog: "Catalog & inventory", charts: "Size charts", keys: "API keys", guide: "Integration guide" };
  const sectionTitle = titles[tab];
  const hasConnectedCatalog = Object.values(connections).some(connection => connection.status === "authorized" && connection.last_sync_at);
  const hasImport = Object.values(connections).some(connection => connection.last_sync_at);
  return <section className={`console-wrap console-workspace${helpOpen ? " console-with-help" : ""}`}>
    <aside className="console-sidebar">
      <div className="console-sidebar-title">Workspace <span>Metr Fit</span></div>
      <div className="console-account">
        <span className="console-avatar" aria-hidden="true">{seller.merchant.name.slice(0, 2).toUpperCase()}</span>
        <div><strong>{seller.merchant.name}</strong><span>Seller workspace</span></div>
      </div>
      <nav className="console-tabs" aria-label="Console sections">
        {([ ["stores", "Stores"], ["catalog", "Catalog & inventory"], ["charts", "Size charts"], ["keys", "API keys"], ["guide", "Integration guide"] ] as const).map(([value, label]) =>
          <button key={value} disabled={busy} aria-current={tab === value ? "page" : undefined} onClick={() => { setTab(value); setSecret(""); }}><ConsoleIcon name={value} />{label}{value === "stores" && <span className="console-nav-count">{stores.length}</span>}</button>
        )}
      </nav>
      <div className="console-sidebar-resources"><span className="console-label">Resources</span><Link href="/docs"><ConsoleIcon name="guide" />API documentation <span aria-hidden="true">↗</span></Link><Link href="/">Visit Metr <span aria-hidden="true">↗</span></Link></div>
      <div className="console-sidebar-bottom">
        <div className="console-user"><span className="console-user-avatar" aria-hidden="true">{seller.account.email.slice(0, 1).toUpperCase()}</span><div><strong>Your account</strong><span>{seller.account.email}</span></div></div>
        <button className="console-signout" disabled={busy} onClick={() => void run(async () => { await call("logout", "POST"); setSeller(null); setStores([]); setKeys([]); setConnections({}); setSecret(""); setLaunchShop(null); setNotice(""); })}><ConsoleIcon name="logout" />Sign out</button>
      </div>
    </aside>

    <div className="console-content">
      <div className="console-toolbar"><span><ConsoleIcon name={tab} />{sectionTitle}</span><button className="console-help-toggle" aria-expanded={helpOpen} aria-controls="console-help" onClick={() => setHelpOpen(!helpOpen)}><ConsoleIcon name="guide" />Setup guide</button></div>
      <div className="console-page">
        <div className="console-heading"><div><h1>{sectionTitle}</h1><p>{tab === "stores" ? "Connect your store and bring your catalog into Metr." : tab === "keys" ? "Manage your store’s access to the Metr Fit API." : tab === "catalog" ? "View imported products, variants and stored availability." : tab === "charts" ? "Upload, verify and reuse size charts across your products." : "From your first connection to a size recommendation."}</p></div>
          {(tab === "stores" || tab === "keys") && <button className="console-primary" disabled={busy || tab === "keys" && !stores.length} onClick={() => { setKind(seller.shopify_enabled ? "shopify" : "custom"); setFormKind(tab === "stores" ? "store" : "key"); }}><ConsoleIcon name="plus" />{tab === "stores" ? "Add store" : "Create API key"}</button>}
        </div>
        <div className="console-feedback" aria-live="polite">
          {error && <div className="console-alert console-error" role="alert"><p>{error}</p>{errorDetails}</div>}
          {notice && <div className="console-alert console-notice" role="status"><p>{notice}</p></div>}
        </div>
        {(tab === "catalog" || tab === "charts") && <ConsoleCatalog mode={tab} stores={stores} storeID={catalogStoreID} onStoreChange={setCatalogStoreID} connections={connections} onBusyChange={setBusy} onStores={() => setTab("stores")} />}
        {tab === "stores" && launchShop && <section className="console-launch" aria-labelledby="shopify-launch-title">
          <span className="console-status">Shop verified</span><h2 id="shopify-launch-title">Connect your Shopify shop</h2>
          <p>Shopify verified <strong>{launchShop}</strong>. Choose which of your Metr stores to link. Nothing is authorized until Shopify approves the connection.</p>
          <label>Metr store<select value={selectedStoreID} disabled={busy} onChange={event => setSelectedStoreID(event.target.value)}><option value="">Select a store</option>{stores.filter(store => /^https:\/\/[a-z0-9][a-z0-9-]*\.myshopify\.com\/?$/.test(store.domain)).map(store => <option key={store.id} value={store.id}>{store.name} — {store.domain}</option>)}</select></label>
          {selectedStore && <p className="console-launch-summary">Link <strong>{launchShop}</strong> to <strong>{selectedStore.name}</strong><br /><span>Saved Metr store: {selectedStore.domain}</span></p>}
          <button className="console-primary" disabled={busy || !seller.shopify_enabled || !selectedStore} onClick={() => { if (selectedStore) void connect(selectedStore); }}>{busy ? "Starting authorization…" : "Continue to Shopify"}<ConsoleIcon name="arrow" /></button>
          {stores.length === 0 && <p>Add a Metr store, then select it here.</p>}
        </section>}

        {tab === "stores" && <>
          <section className="console-list-panel" aria-labelledby="store-list-title">
            <div className="console-list-toolbar"><h2 id="store-list-title">All stores <span>{stores.length}</span></h2><span className="console-small">Store connections</span></div>
            {stores.length === 0 ? <div className="console-empty"><span className="console-empty-icon"><ConsoleIcon name="stores" /></span><h3>Your first store starts here</h3><p>Add your store, connect Shopify or your backend, then prepare your catalog for sizing.</p><button disabled={busy} onClick={() => { setKind(seller.shopify_enabled ? "shopify" : "custom"); setFormKind("store"); }}>Add your first store<ConsoleIcon name="arrow" /></button></div> :
              <ul className="console-store-list">{stores.map(store => {
                const connection = connections[store.id];
                const status = connection?.status;
                const shop = /^https:\/\/[a-z0-9][a-z0-9-]*\.myshopify\.com\/?$/.test(store.domain);
                const canSync = status === "authorized" || retryStore === store.id && shopifySyncAction(status) === "retry";
                return <li key={store.id}>
                  <div className="console-store-heading"><span className="console-store-icon"><ConsoleIcon name="stores" /></span><div className="console-store-name"><h3>{store.name}</h3><p>{store.domain.replace(/^https?:\/\//, "").replace(/\/$/, "")}</p></div><span className={`console-status ${status === "reauthorization_required" || status === "unknown" ? "console-status-warning" : ""}`}>{status === "authorized" ? "Connected" : status === "reauthorization_required" ? "Reconnect needed" : status === "unknown" ? "Status unavailable" : shop ? "Not connected" : "Custom API"}</span></div>
                  <div className="console-store-detail">
                    <p className="console-small">{status === "authorized" ? connection?.last_sync_at ? `Last successful sync: ${new Date(connection.last_sync_at).toLocaleString()}.` : "Shopify connected · catalog not imported." : status === "reauthorization_required" ? "Shopify authorization expired. Reconnect to continue." : status === "unknown" ? "Could not check Shopify status. Refresh to retry." : shop ? "Connect Shopify, then select Sync catalog to import your products." : "Create a store-scoped API key to connect your backend."}</p>
                    {status !== "authorized" && connection?.last_sync_at && <p className="console-small">Last successful sync: {new Date(connection.last_sync_at).toLocaleString()}.</p>}
                    {connection?.last_sync_at && <p className="console-chart-note">Catalog imported. Add and verify size charts to enable recommendations.</p>}
                    <div className="console-store-footer"><code>{store.id}</code><div className="console-actions"><button disabled={busy} onClick={() => { setCatalogStoreID(store.id); setTab("catalog"); }}>View catalog</button>
                      {shop ? <>
                        {canSync ? <button disabled={busy} onClick={() => void syncCatalog(store)}>{syncingStore === store.id ? "Syncing catalog…" : retryStore === store.id ? "Retry sync" : "Sync catalog"}</button> : <button disabled={busy || !seller.shopify_enabled || !!launchShop} onClick={() => void connect(store)}>{launchShop ? "Select this store above" : status === "reauthorization_required" ? "Reconnect Shopify" : "Connect Shopify"}<ConsoleIcon name="arrow" /></button>}
                        {["authorized", "reauthorization_required"].includes(status || "") && <details className="console-menu"><summary aria-label={`More actions for ${store.name}`}><ConsoleIcon name="more" /></summary><div>
                          {status === "authorized" && <button disabled={busy || !seller.shopify_enabled || !!launchShop} onClick={() => void connect(store)}>{launchShop ? "Select this store above" : "Authorize again"}</button>}
                          <button className="console-destructive" disabled={busy} onClick={() => void run(async () => { await call(`stores/${store.id}/shopify`, "DELETE"); setConnections(previous => { const remaining = { ...previous }; delete remaining[store.id]; return remaining; }); setRetryStore(null); await refresh(); setNotice("Stored Shopify credentials removed. To uninstall the app, use Shopify admin."); })}>Remove connection</button>
                        </div></details>}
                      </> : <button disabled={busy} onClick={() => { setTab("keys"); setSecret(""); }}>Manage API keys<ConsoleIcon name="arrow" /></button>}
                    </div></div>
                  </div>
                </li>;
              })}</ul>}
          </section>
          {!seller.shopify_enabled && <div className="console-alert"><p>Shopify authorization is awaiting operator configuration. Custom API integration is available.</p></div>}
          <p className="console-learn">Learn more about <Link href="/docs">connecting your store <span aria-hidden="true">↗</span></Link></p>
        </>}

        {tab === "keys" && <>
          {secret && <div className="console-secret" role="status"><span className="console-status console-status-warning">Shown once</span><h2>Save your API key</h2><p>Keep this key in your backend’s secret manager. It won’t be shown again.</p><code>{secret}</code><div className="console-actions"><button onClick={() => void run(async () => { await navigator.clipboard.writeText(secret); setNotice("Key copied. Save it securely on your server."); })}>Copy key</button><button onClick={() => setSecret("")}>I’ve saved it</button></div></div>}
          <section className="console-list-panel" aria-labelledby="key-list-title"><div className="console-list-toolbar"><h2 id="key-list-title">Integration keys <span>{keys.length}</span></h2><span className="console-small">Backend access</span></div>
            {keys.length === 0 ? <div className="console-empty"><span className="console-empty-icon"><ConsoleIcon name="keys" /></span><h3>No API keys yet</h3><p>{stores.length ? "Create a key for your store to start making requests from your backend." : "Add a store first. Each API key belongs to one of your stores."}</p><button disabled={busy} onClick={() => { if (stores.length) setFormKind("key"); else setTab("stores"); }}>{stores.length ? "Create your first key" : "Go to stores"}<ConsoleIcon name="arrow" /></button></div> : <ul className="console-store-list">{keys.map(key => <li key={key.id}>
              <div className="console-store-heading"><span className="console-store-icon"><ConsoleIcon name="keys" /></span><div className="console-store-name"><h3>{key.name}</h3><p>{stores.find(store => store.id === key.store_id)?.name || key.store_id || "All stores"}</p></div><span className="console-status">{key.revoked_at ? "Revoked" : key.expires_at && new Date(key.expires_at) < new Date() ? "Expired" : "Active"}</span></div>
              <div className="console-store-detail"><p className="console-small">Permissions: {key.scopes.join(", ")}</p><div className="console-store-footer"><code>{key.prefix}…</code>{!key.revoked_at && <button className="console-destructive" disabled={busy} onClick={() => { if (window.confirm(`Revoke “${key.name}”? Integrations using it will stop working.`)) void run(async () => { await call(`api-keys/${key.id}`, "DELETE"); await refresh(); setNotice("API key revoked."); }); }}>Revoke key</button>}</div></div>
            </li>)}</ul>}
          </section><p className="console-learn">Read the <Link href="/docs">API documentation <span aria-hidden="true">↗</span></Link></p>
        </>}

        {tab === "guide" && <section className="console-guide"><ol>
          <li><span>01</span><div><h2>Connect your store</h2><p>Add a store to Metr, then authorize Shopify or issue a store-scoped key for your backend.</p><button onClick={() => setTab("stores")}>Open stores<ConsoleIcon name="arrow" /></button></div></li>
          <li><span>02</span><div><h2>Import your catalog</h2><p>After connecting Shopify, explicitly select Sync catalog to import products and variants. Resync preserves product type, gender, fit, stretch and chart links; missing Shopify items become unavailable.</p></div></li>
          <li><span>03</span><div><h2>Add and verify size charts</h2><p>Sync imports no charts. Upload a CSV or enter measurements in Size charts, verify the values, and assign the chart to one or more products in the same category.</p></div></li>
          <li><span>04</span><div><h2>Build the sizing experience</h2><p>Your backend starts a sizing session, requests each next question and submits the answers for a recommendation. Recheck inventory before checkout and report confirmed purchases and size returns.</p><p>Confidence is an uncalibrated evidence score. Show the size chart if sizing cannot recommend a suitable size.</p><Link className="console-inline-link" href="/docs">Open API documentation <span aria-hidden="true">↗</span></Link></div></li>
        </ol></section>}
      </div>
    </div>

    {helpOpen && <aside id="console-help" className="console-help">
      <div className="console-toolbar"><span><ConsoleIcon name="guide" />Setup guide</span><button className="console-icon-button" aria-label="Close setup guide" onClick={() => setHelpOpen(false)}><ConsoleIcon name="close" /></button></div>
      <div className="console-help-body"><span className="console-help-mark" aria-hidden="true"><img src="/brand/metr-icon-white-on-black.svg" alt="" width="44" height="44" /></span><span className="console-label">YOUR NEXT STEPS</span><h2>{tab === "keys" ? "Set up backend access." : "Let’s get your store ready."}</h2>
        <p>{tab === "keys" ? "Give your backend only the access it needs to serve your store." : "Import your products, then add verified size charts to enable recommendations."}</p>
        {tab === "keys" ? <ol className="console-checklist"><li><span>1</span><div><strong>Choose one store</strong><p>Each key is scoped to its selected store.</p></div></li><li><span>2</span><div><strong>Set permissions</strong><p>Enable only the API scopes your integration uses.</p></div></li><li><span>3</span><div><strong>Save it securely</strong><p>Keep keys on your backend, never in theme or browser code.</p></div></li></ol> : <ol className="console-checklist">
          <li data-complete={stores.length > 0}><span>{stores.length ? <ConsoleIcon name="check" /> : "1"}</span><div><strong>Add your store</strong><p>Your catalog and API keys live here.</p></div></li>
          <li data-complete={hasConnectedCatalog}><span>{hasConnectedCatalog ? <ConsoleIcon name="check" /> : "2"}</span><div><strong>Connect and import</strong><p>Authorize Shopify, then select Sync catalog. Or use the catalog API.</p></div></li>
          <li><span>3</span><div><strong>Add verified size charts</strong><p>{hasImport ? "Catalog imported. Add and verify size charts to enable recommendations." : "Upload size charts separately, then assign them to products."}</p></div></li>
        </ol>}
      </div>
      <div className="console-help-footer"><p>Need the technical details?</p><Link href="/docs">Read the integration docs<ConsoleIcon name="arrow" /></Link></div>
    </aside>}

    <dialog ref={dialog} className="console-dialog" aria-labelledby="console-dialog-title" onClose={() => setFormKind(null)}>
      <div className="console-dialog-heading"><div><span className="console-label">{formKind === "store" ? "STORE CONNECTION" : "BACKEND ACCESS"}</span><h2 id="console-dialog-title">{formKind === "store" ? "Add a store" : "Create an API key"}</h2></div><button className="console-icon-button" aria-label="Close dialog" disabled={busy} onClick={() => setFormKind(null)}><ConsoleIcon name="close" /></button></div>
      {formKind === "store" ? <form onSubmit={createStore}><p>Give your catalog a home in Metr.</p><fieldset disabled={busy}>
        <label>Integration<select value={kind} onChange={event => setKind(event.target.value)}><option value="shopify" disabled={!seller.shopify_enabled}>Shopify{!seller.shopify_enabled ? " (not configured)" : ""}</option><option value="custom">Custom API</option></select></label>
        <label>Store name<input name="name" autoFocus maxLength={120} placeholder="Your store name" required /></label>
        <label key={kind}>{kind === "shopify" ? "Shopify store address" : "Store URL"}<input name="domain" type="url" defaultValue={kind === "shopify" && launchShop ? `https://${launchShop}` : undefined} placeholder={kind === "shopify" ? "https://your-store.myshopify.com" : "https://your-store.com"} pattern={kind === "shopify" ? "https://[a-z0-9][a-z0-9-]*\\.myshopify\\.com/?" : undefined} maxLength={240} required aria-describedby="store-domain-help" /></label>
        <p id="store-domain-help" className="console-small">{kind === "shopify" ? "Use your permanent myshopify.com address. You’ll authorize Shopify after adding your store." : "Calls to Metr must come from your backend."}</p>
        {error && <div className="console-error" role="alert"><p>{error}</p>{errorDetails}</div>}
        <div className="console-dialog-actions"><button type="button" onClick={() => setFormKind(null)}>Cancel</button><button className="console-primary">{busy ? "Adding store…" : "Add store"}</button></div>
      </fieldset></form> : <form onSubmit={createKey}><p>Create a key for calls from your backend.</p><fieldset disabled={busy}>
        <label>Key name<input name="name" autoFocus required maxLength={120} defaultValue="Store integration" /></label>
        <label>Store<select name="store">{stores.map(store => <option key={store.id} value={store.id}>{store.name}</option>)}</select></label>
        <fieldset className="console-scopes"><legend>Permissions</legend>{["catalog", "fit", "events", "analytics"].map(scope => <label key={scope}><input type="checkbox" name="scopes" value={scope} defaultChecked={scope !== "analytics"} />{scope}</label>)}</fieldset>
        {error && <div className="console-error" role="alert"><p>{error}</p>{errorDetails}</div>}
        <div className="console-dialog-actions"><button type="button" onClick={() => setFormKind(null)}>Cancel</button><button className="console-primary">{busy ? "Creating…" : "Create key"}</button></div>
      </fieldset></form>}
    </dialog>
  </section>;
}
