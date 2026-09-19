"use client";
import { useId, useState } from "react";
import {
  examples,
  demoSize,
  fitSummary,
  sizes,
  sizeChart,
} from "@/lib/demo";
export function Garment({
  type = "tee",
  color = "#30302b",
  dims,
}: {
  type?: string;
  color?: string;
  dims?: { chest: number; length: number };
}) {
  const id = useId();
  return (
    <svg
      className="garment"
      viewBox="0 0 250 230"
      role="img"
      aria-label={`${type === "trousers" ? "Straight trousers" : type === "shirt" ? "Camp collar shirt" : "Cotton t-shirt"} illustration`}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2=".7">
          <stop stopColor={color} />
          <stop offset=".45" stopColor={color} />
          <stop offset="1" stopColor="#111110" />
        </linearGradient>
      </defs>
      <g transform="translate(15 0)">
        {type === "trousers" ? (
          <>
            <path
              d="M65 23 L156 23 172 208 124 208 110 82 97 208 48 208Z"
              fill={`url(#${id})`}
              stroke="#77776b"
              strokeWidth=".5"
            />
            <path
              d="M65 35H156M110 25V80M70 39Q68 61 57 69M150 39Q153 61 165 69M110 29L119 30 118 64"
              fill="none"
              stroke="#aaa99a"
              opacity=".25"
            />
          </>
        ) : (
          <>
            <path
              d="M76 35L47 45 13 99 46 120 61 99 56 207Q110 214 165 207L160 99 176 120 208 99 174 45 144 35Q110 47 76 35Z"
              fill={`url(#${id})`}
              stroke="#77776b"
              strokeWidth=".5"
            />
            <path
              d="M76 35Q109 73 144 35M59 61L61 99M162 61L160 99M59 200Q110 206 163 200M23 95L48 111M172 111L199 95"
              fill="none"
              stroke="#b2b0a0"
              strokeWidth="1"
              opacity=".22"
            />
            {type === "shirt" && (
              <>
                <path
                  d="M77 35L92 65 109 48 128 65 144 35 125 28 110 43 94 28Z"
                  fill={color}
                  stroke="#858577"
                  strokeWidth=".5"
                />
                <path
                  d="M110 48V208M128 81H149V103H128Z"
                  fill="none"
                  stroke="#969687"
                  opacity=".35"
                />
                {[76, 103, 130, 157, 184].map((y) => (
                  <circle key={y} cx="112" cy={y} r="1.3" fill="#8d8d7d" />
                ))}
              </>
            )}
          </>
        )}
      </g>
      {dims && (
        <g className="garment-dims" aria-hidden="true">
          <path d="M74 118H175M74 112V124M175 112V124" />
          <text x="124" y="110" textAnchor="middle">
            {dims.chest} cm
          </text>
          <path d="M234 35V207M228 35H240M228 207H240" />
          <text x="230" y="124" textAnchor="middle" transform="rotate(-90 230 124)">
            {dims.length} cm
          </text>
        </g>
      )}
    </svg>
  );
}
export function DiscoverDemo({ large = false }: { large?: boolean }) {
  const [selected, setSelected] = useState(0);
  const item = examples[selected];
  return (
    <div className={`demo discovery-demo ${large ? "large-demo" : ""}`}>
      <div className="demo-top">
        <span>Metr / Discover</span>
        <span>Sample catalog · interactive</span>
      </div>
      <div className="demo-body" key={selected}>
        <div className="demo-query">
          <span className="reading-label">Customer asks</span>
          <p>“{item.query}”</p>
        </div>
        <dl className="reading">
          <div className="reading-head">
            <span className="reading-label">Reading</span>
            <span className="reading-label">Metr understood</span>
          </div>
          {item.intent.map(([k, v], i) => (
            <div key={k} style={{ animationDelay: `${120 + i * 90}ms` }}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        <div className="matches-head">
          <span className="reading-label">Matches</span>
          <span>3 of 412 in stock</span>
        </div>
        <div className="product-grid">
          {item.products.map((p, i) => (
            <div
              className="product-card"
              key={p.name}
              style={{ animationDelay: `${420 + i * 110}ms` }}
            >
              <div className="product-image">
                <Garment type={p.type} color={p.color} />
              </div>
              <h3>{p.name}</h3>
              <div className="product-meta">
                <span>Rs {p.price}</span>
                <span>{p.matched}</span>
              </div>
            </div>
          ))}
        </div>
        {large && <p className="demo-explanation">{item.explanation}</p>}
      </div>
      <div className="prompt-switch" role="tablist" aria-label="Example requests">
        {examples.map((example, i) => (
          <button
            key={example.short}
            role="tab"
            aria-selected={selected === i}
            onClick={() => setSelected(i)}
          >
            {example.short}
          </button>
        ))}
      </div>
    </div>
  );
}
export function FitDemo() {
  const [size, setSize] = useState("M");
  const [preference, setPreference] = useState("Relaxed");
  const recommended = demoSize(size, preference);
  const col = sizes.indexOf(recommended);
  const summary = fitSummary(preference);
  return (
    <div className="demo fit-demo">
      <div className="demo-top">
        <span>Metr / Fit</span>
        <span>Sample garment · interactive</span>
      </div>
      <div className="fit-body">
        <div className="fit-garment">
          <Garment
            color="#b6b09e"
            dims={{ chest: sizeChart.chest[col], length: sizeChart.length[col] }}
          />
        </div>
        <div className="fit-side">
          <span className="reading-label">Spec 0412</span>
          <h3>Essential oversized tee</h3>
          <p>Heavyweight cotton, dropped shoulder. Merchant size chart.</p>
          <div className="fit-controls">
            <label>
              Your usual size
              <select value={size} onChange={(e) => setSize(e.target.value)}>
                {sizes.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label>
              How you like it to sit
              <select
                value={preference}
                onChange={(e) => setPreference(e.target.value)}
              >
                {["Close", "Relaxed", "Oversized"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>
      <table className="pom">
        <caption className="reading-label">Points of measure, cm</caption>
        <thead>
          <tr>
            <th scope="col">Size</th>
            {sizes.map((s, i) => (
              <th key={s} scope="col" aria-current={i === col ? "true" : undefined}>
                {s}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(["chest", "length", "shoulder"] as const).map((row) => (
            <tr key={row}>
              <th scope="row">{row}</th>
              {sizeChart[row].map((v, i) => (
                <td key={i} aria-current={i === col ? "true" : undefined}>
                  {v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="fit-result" aria-live="polite">
        <div>
          <span className="reading-label">Recommended</span>
          <strong key={recommended}>{recommended}</strong>
        </div>
        <dl className="reading">
          <div>
            <dt>Shoulders</dt>
            <dd>{summary.shoulders}</dd>
          </div>
          <div>
            <dt>Chest</dt>
            <dd>{summary.chest}</dd>
          </div>
          <div>
            <dt>Length</dt>
            <dd>{summary.length}</dd>
          </div>
        </dl>
      </div>
      <p className="demo-note">
        Illustrative. Real recommendations use the merchant’s approved chart
        and the customer’s own inputs.
      </p>
    </div>
  );
}
