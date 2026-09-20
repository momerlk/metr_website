import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Label } from "@/components/site";
import { APIReference } from "@/components/api-reference";
import { docsHref, fitDocs, sectionId, type DocBlock } from "@/lib/fit-docs";

type Props = { params: Promise<{ slug?: string[] }> };
export const dynamicParams = false;
export function generateStaticParams() {
  return fitDocs.map(page => ({ slug: page.slug ? [page.slug] : [] }));
}
function findPage(slug?: string[]) {
  return fitDocs.find(page => page.slug === (slug || []).join("/"));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = findPage((await params).slug);
  if (!page) return {};
  return {
    title: `${page.title} · Documentation`,
    description: page.description,
    alternates: { canonical: docsHref(page.slug) },
    openGraph: { title: `${page.title} — Metr Fit`, description: page.description },
  };
}
function Block({ block }: { block: DocBlock }) {
  switch (block.type) {
    case "paragraph": return <p>{block.text}</p>;
    case "code": return <pre className="docs-code" tabIndex={0} aria-label={`${block.language} example`}><code>{block.text}</code></pre>;
    case "list": return <ul>{block.items.map(item => <li key={item}>{item}</li>)}</ul>;
    case "table": return (
      <div className="docs-table-scroll" role="region" aria-label="Reference table" tabIndex={0}>
        <table className="docs-table">
          <thead><tr>{block.columns.map(column => <th key={column}>{column}</th>)}</tr></thead>
          <tbody>{block.rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>)}</tbody>
        </table>
      </div>
    );
  }
}
export default async function DocumentationPage({ params }: Props) {
  const page = findPage((await params).slug);
  if (!page) notFound();
  const index = fitDocs.indexOf(page);
  const previous = fitDocs[index - 1];
  const next = fitDocs[index + 1];
  return (
    <div className="wrap docs-layout">
      <aside className="docs-sidebar">
        <Link href="/docs" className="docs-brand">Metr Fit <span>Developer docs</span></Link>
        <nav aria-label="Documentation">
          {fitDocs.map(item => <Link key={item.slug} href={docsHref(item.slug)} aria-current={item.slug === page.slug ? "page" : undefined}>{item.slug === "" ? "Introduction" : item.slug === "quickstart" ? "Quickstart" : item.slug === "api-reference" ? "API reference" : item.title}</Link>)}
        </nav>
        <a href="/api/metr-fit-openapi.json" download className="text-link">Download OpenAPI <span aria-hidden="true">↓</span></a>
      </aside>
      <article className="docs-article">
        <header className="docs-heading">
          <Label>Metr Fit / API V1</Label>
          <h1>{page.title}</h1>
          <p>{page.description}</p>
        </header>
        <nav className="docs-on-page" aria-label="On this page">
          <span className="reading-label">On this page</span>
          {page.sections.map(section => <a key={section.title} href={`#${sectionId(section.title)}`}>{section.title}</a>)}
          {page.slug === "api-reference" && <><a href="#operations">Operations</a><a href="#schemas">Schemas</a></>}
        </nav>
        {page.sections.map(section => (
          <section className="docs-section" key={section.title} aria-labelledby={sectionId(section.title)}>
            <h2 id={sectionId(section.title)}>{section.title}</h2>
            {section.blocks.map((block, i) => <Block key={i} block={block} />)}
          </section>
        ))}
        {page.slug === "api-reference" && <APIReference />}
        <nav className="docs-pagination" aria-label="Next documentation topic">
          {previous && <Link href={docsHref(previous.slug)}><span>Previous</span>{previous.title}</Link>}
          {next && <Link href={docsHref(next.slug)}><span>Next</span>{next.title}</Link>}
        </nav>
      </article>
    </div>
  );
}
