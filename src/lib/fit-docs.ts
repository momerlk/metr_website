import pages from "./generated/fit-docs.json";
import contract from "./generated/fit-openapi.json";

export type DocBlock =
  | { type: "paragraph"; text: string }
  | { type: "code"; text: string; language: string }
  | { type: "list"; items: string[] }
  | { type: "table"; columns: string[]; rows: string[][] };
export type DocPage = {
  slug: string;
  title: string;
  description: string;
  sections: { title: string; blocks: DocBlock[] }[];
};
export type Schema = {
  $ref?: string;
  type?: string;
  format?: string;
  description?: string;
  properties?: Record<string, Schema>;
  required?: string[];
  items?: Schema;
  enum?: string[];
  anyOf?: Schema[];
  minimum?: number;
  maximum?: number;
  minItems?: number;
  maxItems?: number;
  maxLength?: number;
  additionalProperties?: Schema | boolean;
};
export type Operation = {
  summary: string;
  description: string;
  operationId: string;
  tags: string[];
  parameters?: { name: string; in: string; required?: boolean; description?: string; schema: Schema }[];
  requestBody?: { content: Record<string, { schema: Schema; example?: unknown }> };
  responses: Record<string, { description: string; content?: Record<string, { schema: Schema; example?: unknown }> }>;
};
export const fitDocs = pages as DocPage[];
export const fitOpenAPI = contract as unknown as {
  info: { title: string; version: string; description: string };
  paths: Record<string, Record<string, Operation>>;
  components: { schemas: Record<string, Schema> };
};
export function docsHref(slug: string) {
  return slug ? `/docs/${slug}` : "/docs";
}
export function sectionId(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
