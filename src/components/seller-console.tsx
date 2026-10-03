"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { shopifySyncAction, shopifySyncMessage, shopifySyncFailure, preserveShopifySync, shopifyCallbackErrors, shopifyAppLaunch, shopifyRequestID, type Seller, type Store, type APIKey, type ShopifyConnection, type ShopifySyncResult } from "@/lib/console";

async function call<T>(path: string, method = "GET", data?: unknown): Promise<T> {
  const response = await fetch(`/api/console/${path}`, { method, headers: { "Content-Type": "application/json", "X-Metr-Console": "1" }, ...(data !== undefined ? { body: JSON.stringify(data) } : {}), cache: "no-store" });
  const result = await response.json();
  if (!response.ok) throw Object.assign(new Error(result.error || "Please try again."), { status: response.status, code: result.code, requestID: shopifyRequestID(result.request_id) });
  return result;
}
export default function SellerConsole() {
  const [seller, setSeller] = useState<Seller | null>(null), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("signup"), [tab, setTab] = useState<"stores" | "keys" | "guide">("stores");
  const [stores, setStores] = useState<Store[]>([]), [keys, setKeys] = useState<APIKey[]>([]), [connections, setConnections] = useState<Record<string, ShopifyConnection>>({});
  const [error, setError] = useState(""), [notice, setNotice] = useState(""), [secret, setSecret] = useState("");
  const [launchShop, setLaunchShop] = useState<string | null>(null);
  const [selectedStoreID, setSelectedStoreID] = useState("");
  const [requestID, setRequestID] = useState<string | undefined>();
  const syncLock = useRef(false);
  const [syncingStore, setSyncingStore] = useState<string | null>(null), [retryStore, setRetryStore] = useState<string | null>(null);
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
    void run(async () => { await call("stores", "POST", { name: values.get("name"), domain: values.get("domain") }); form.reset(); await refresh(); setNotice("Store created. Authorize Shopify or create an API key to continue."); });
  }
  function createKey(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const values = new FormData(event.currentTarget);
    void run(async () => { setSecret(""); const issued = await call<{ secret: string }>("api-keys", "POST", { name: values.get("name"), store_id: values.get("store"), scopes: values.getAll("scopes") }); setSecret(issued.secret); await refresh(); });
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
  return <section className="console-wrap console-workspace">
    <aside className="console-sidebar">
      <div className="console-account"><span className="console-avatar" aria-hidden="true">{seller.merchant.name.slice(0, 1).toUpperCase()}</span><div><strong>{seller.merchant.name}</strong><span>Seller workspace</span></div></div>
      <nav className="console-tabs" aria-label="Console sections">{([ ["stores", "Stores", "▦"], ["keys", "API keys", "⌘"], ["guide", "Integration guide", "≡"] ] as const).map(([value, label, icon]) => <button key={value} aria-current={tab === value ? "page" : undefined} onClick={() => { setTab(value); setSecret(""); }}><span aria-hidden="true">{icon}</span>{label}</button>)}</nav>
      <div className="console-sidebar-bottom"><span>{seller.account.email}</span><button disabled={busy} onClick={() => void run(async () => { await call("logout", "POST"); setSeller(null); setStores([]); setKeys([]); setConnections({}); setSecret(""); setLaunchShop(null); setNotice(""); })}>Sign out</button></div>
    </aside>
    <div className="console-content"><div className="console-heading"><div><span className="console-label">Workspace / {tab === "stores" ? "Stores" : tab === "keys" ? "API keys" : "Integration guide"}</span><h1>{tab === "stores" ? "Stores" : tab === "keys" ? "API keys" : "Integration guide"}</h1><p>{tab === "stores" ? "Manage your stores and their integration with Metr Fit." : tab === "keys" ? "Manage backend access to your stores." : "Set up product-specific size recommendations."}</p></div><span className="console-product-badge">Metr Fit</span></div>
    <p className="console-error" role="alert">{error}</p>{errorDetails}<p role="status">{notice}</p>
    {tab === "stores" && launchShop && <section className="console-launch" aria-labelledby="shopify-launch-title">
      <h2 id="shopify-launch-title">Connect your Shopify shop</h2>
      <p>Shopify verified <strong>{launchShop}</strong>. Choose which of your Metr stores to link. Nothing is authorized until Shopify approves the connection.</p>
      <label>Metr store<select value={selectedStoreID} disabled={busy} onChange={event => setSelectedStoreID(event.target.value)}><option value="">Select a store</option>{stores.filter(store => /^https:\/\/[a-z0-9][a-z0-9-]*\.myshopify\.com\/?$/.test(store.domain)).map(store => <option key={store.id} value={store.id}>{store.name} — {store.domain}</option>)}</select></label>
      {selectedStore && <p className="console-launch-summary">Link <strong>{launchShop}</strong> to <strong>{selectedStore.name}</strong><br /><span>Saved Metr store: {selectedStore.domain}</span></p>}
      <button className="console-primary" disabled={busy || !seller.shopify_enabled || !selectedStore} onClick={() => { if (selectedStore) void connect(selectedStore); }}>{busy ? "Starting authorization…" : "Continue to Shopify"}</button>
      {stores.length === 0 && <p>Add a Metr store below, then select it here.</p>}
    </section>}
    {tab === "stores" && <div className="console-columns"><div><h2>Your stores</h2>{stores.length === 0 ? <div className="console-empty"><h3>Add your first store</h3><p>Your store ID connects its products, size charts and recommendations. Start with a sample store while you test.</p></div> : <ul className="console-store-list">{stores.map(store => { const status = connections[store.id]?.status; const shop = /^https:\/\/[a-z0-9][a-z0-9-]*\.myshopify\.com\/?$/.test(store.domain); return <li key={store.id}><h3>{store.name}</h3><p>{store.domain}</p><code>{store.id}</code><p className="console-small">{status === "authorized" ? (connections[store.id]?.last_sync_at ? `Last successful sync: ${new Date(connections[store.id]!.last_sync_at!).toLocaleString()}.` : "Shopify connected · catalog not imported.") : status === "reauthorization_required" ? "Shopify authorization expired · reconnect to continue" : status === "unknown" ? "Could not check Shopify status · refresh to retry" : shop ? "Shopify not connected" : "Custom API · create a key to integrate"}</p>{status !== "authorized" && connections[store.id]?.last_sync_at && <p className="console-small">Last successful sync: {new Date(connections[store.id]!.last_sync_at!).toLocaleString()}.</p>}{connections[store.id]?.last_sync_at && <p className="console-small">Catalog imported. Add and verify size charts to enable recommendations.</p>}{shop && <div className="console-actions"><button disabled={busy || !seller.shopify_enabled || !!launchShop} onClick={() => void connect(store)}>{launchShop ? "Select this store above" : status === "authorized" ? "Authorize again" : status === "reauthorization_required" ? "Reconnect Shopify" : "Connect Shopify"}</button>{(status === "authorized" || retryStore === store.id && shopifySyncAction(status) === "retry") && <button disabled={busy} onClick={() => void syncCatalog(store)}>{syncingStore === store.id ? "Syncing catalog…" : retryStore === store.id ? "Retry sync" : "Sync catalog"}</button>}{["authorized", "reauthorization_required"].includes(status || "") && <button disabled={busy} onClick={() => void run(async () => { await call(`stores/${store.id}/shopify`, "DELETE"); setConnections(previous => { const remaining = { ...previous }; delete remaining[store.id]; return remaining; }); setRetryStore(null); await refresh(); setNotice("Stored Shopify credentials removed. To uninstall the app, use Shopify admin."); })}>Remove connection</button>}</div>}</li>; })}</ul>}{!seller.shopify_enabled && <p className="console-small">Shopify authorization is awaiting operator configuration. Custom API integration is available.</p>}</div>
      <aside><h2>Add a store</h2><form onSubmit={createStore}><fieldset disabled={busy}><label>Integration<select value={kind} onChange={event => setKind(event.target.value)}><option value="shopify" disabled={!seller.shopify_enabled}>Shopify{!seller.shopify_enabled ? " (not configured)" : ""}</option><option value="custom">Custom API</option></select></label><label>Store name<input name="name" maxLength={120} required /></label><label key={kind}>{kind === "shopify" ? "Shopify store address" : "Store URL"}<input name="domain" type="url" defaultValue={kind === "shopify" && launchShop ? `https://${launchShop}` : undefined} placeholder={kind === "shopify" ? "https://your-store.myshopify.com" : "https://your-store.com"} pattern={kind === "shopify" ? "https://[a-z0-9][a-z0-9-]*\\.myshopify\\.com/?" : undefined} maxLength={240} required /></label><p className="console-small">{kind === "shopify" ? "Use the permanent myshopify.com address, not your custom domain." : "Calls to Metr must come from your backend."}</p><button className="console-primary">{busy ? "Saving…" : "Add store"}</button></fieldset></form></aside></div>}
    {tab === "keys" && <><div className="console-columns"><div><h2>Integration keys</h2><p>Store keys on your backend. Each key can access only its assigned store and scopes.</p>{secret && <div className="console-secret"><h3>Save this key now</h3><p>It is shown once. Save it in your server’s secret manager.</p><code>{secret}</code><div className="console-actions"><button onClick={() => void run(async () => { await navigator.clipboard.writeText(secret); setNotice("Key copied. Save it securely on your server."); })}>Copy key</button><button onClick={() => setSecret("")}>Hide key</button></div></div>}{keys.length === 0 ? <p>No API keys yet.</p> : <ul className="console-store-list">{keys.map(key => <li key={key.id}><h3>{key.name}</h3><p><code>{key.prefix}…</code> · {key.revoked_at ? "Revoked" : key.expires_at && new Date(key.expires_at) < new Date() ? "Expired" : "Active"}</p><p className="console-small">{key.scopes.join(" · ")}<br />Store: {stores.find(store => store.id === key.store_id)?.name || key.store_id || "All stores"}</p>{!key.revoked_at && <button disabled={busy} onClick={() => { if (window.confirm(`Revoke “${key.name}”? Integrations using it will stop working.`)) void run(async () => { await call(`api-keys/${key.id}`, "DELETE"); await refresh(); setNotice("API key revoked."); }); }}>Revoke key</button>}</li>)}</ul>}</div><aside><h2>Create an API key</h2>{stores.length ? <form onSubmit={createKey}><fieldset disabled={busy}><label>Key name<input name="name" required maxLength={120} defaultValue="Store integration" /></label><label>Store<select name="store">{stores.map(store => <option key={store.id} value={store.id}>{store.name}</option>)}</select></label><fieldset className="console-scopes"><legend>Permissions</legend>{["catalog", "fit", "events", "analytics"].map(scope => <label key={scope}><input type="checkbox" name="scopes" value={scope} defaultChecked={scope !== "analytics"} />{scope}</label>)}</fieldset><button className="console-primary">{busy ? "Creating…" : "Create key"}</button></fieldset></form> : <p>Add a store before creating a key.</p>}</aside></div></>}
    {tab === "guide" && <div className="console-guide"><h2>From store to sizing</h2><ol><li><h3>Connect your store</h3><p>Authorize Shopify or issue a store-scoped key for your backend.</p></li><li><h3>Prepare your catalog</h3><p>After connecting Shopify, explicitly select Sync catalog to import products and variants. Resync preserves product type, gender, fit, stretch and chart links; missing Shopify items become unavailable. Sync imports no charts. Add and verify size charts to enable recommendations. For custom integrations, use the catalog API.</p></li><li><h3>Run the customer quiz</h3><p>Your backend starts a sizing session, requests each next question and submits the answers for a recommendation. Never expose API keys in theme code.</p></li><li><h3>Connect the result to checkout</h3><p>Recheck inventory, let the customer choose, and report confirmed purchases and size returns from your backend.</p></li></ol><p>Confidence is an uncalibrated evidence score. Show the size chart if sizing cannot recommend a suitable size.</p><Link className="console-primary" href="/docs">Open API documentation →</Link></div>}
    </div>
  </section>;
}
