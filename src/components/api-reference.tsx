import { fitOpenAPI, type Schema } from "@/lib/fit-docs";

function schemaName(schema: Schema): string {
  if (schema.$ref) return schema.$ref.split("/").at(-1) || "object";
  if (schema.anyOf) return schema.anyOf.map(schemaName).join(" | ");
  if (schema.type === "array") return `${schemaName(schema.items || {})}[]`;
  return schema.format || schema.type || "object";
}
function SchemaLink({ schema }: { schema: Schema }) {
  const ref = schema.$ref || schema.items?.$ref;
  return ref ? (
    <a href={`#schema-${ref.split("/").at(-1)}`}><code>{schemaName(schema)}</code></a>
  ) : <code>{schemaName(schema)}</code>;
}
function constraints(schema: Schema) {
  return [
    schema.description,
    schema.enum && `Allowed: ${schema.enum.join(", ")}.`,
    schema.minimum !== undefined && `Minimum: ${schema.minimum}.`,
    schema.maximum !== undefined && `Maximum: ${schema.maximum}.`,
    schema.maxLength !== undefined && `Maximum length: ${schema.maxLength}.`,
    schema.minItems !== undefined && `Minimum items: ${schema.minItems}.`,
    schema.maxItems !== undefined && `Maximum items: ${schema.maxItems}.`,
  ].filter(Boolean).join(" ");
}
export function APIReference() {
  return (
    <>
      <section className="docs-section" aria-labelledby="operations">
        <h2 id="operations">Operations</h2>
        <p>Expand an endpoint for its scope, parameters, request and response contracts.</p>
        <div className="api-operations">
          {Object.entries(fitOpenAPI.paths).flatMap(([path, methods]) =>
            Object.entries(methods).map(([method, operation]) => (
              <details className="api-operation" key={operation.operationId} id={operation.operationId}>
                <summary>
                  <span className="api-method">{method.toUpperCase()}</span>
                  <code>{path}</code>
                  <span className="api-summary">{operation.summary}</span>
                </summary>
                <div className="api-operation-body">
                  <p>{operation.description}</p>
                  {operation.parameters && (
                    <div className="docs-table-scroll" role="region" aria-label={`${operation.summary} parameters`} tabIndex={0}>
                      <table className="docs-table">
                        <thead><tr><th>Parameter</th><th>Location</th><th>Details</th></tr></thead>
                        <tbody>{operation.parameters.map(parameter => (
                          <tr key={parameter.name}>
                            <td><code>{parameter.name}</code></td>
                            <td>{parameter.in}{parameter.required ? " · required" : " · optional"}</td>
                            <td>{parameter.description} {constraints(parameter.schema)}</td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  )}
                  {operation.requestBody && Object.values(operation.requestBody.content).map((body, index) => (
                    <div key={index}>
                      <h3>Request body</h3>
                      <p><SchemaLink schema={body.schema} /></p>
                      {body.example !== undefined && <pre className="docs-code" tabIndex={0}><code>{JSON.stringify(body.example, null, 2)}</code></pre>}
                    </div>
                  ))}
                  <h3>Responses</h3>
                  <dl className="api-responses">
                    {Object.entries(operation.responses).map(([status, response]) => (
                      <div key={status}>
                        <dt><code>{status}</code></dt>
                        <dd>{response.description}{response.content?.["application/json"] && <> · <SchemaLink schema={response.content["application/json"].schema} /></>}</dd>
                      </div>
                    ))}
                  </dl>
                  {Object.values(operation.responses).flatMap(response => Object.values(response.content || {}).filter(body => body.example !== undefined).map((body, i) => (
                    <pre className="docs-code" key={i} tabIndex={0}><code>{JSON.stringify(body.example, null, 2)}</code></pre>
                  )))}
                </div>
              </details>
            ))
          )}
        </div>
      </section>
      <section className="docs-section" aria-labelledby="schemas">
        <h2 id="schemas">Request and response schemas</h2>
        <p>Fields marked required appear in the contract. Optional body measurements remain optional even when the chart itself requires those areas.</p>
        {Object.entries(fitOpenAPI.components.schemas).sort(([a], [b]) => a.localeCompare(b)).map(([name, schema]) => (
          <section className="api-schema" id={`schema-${name}`} key={name}>
            <h3>{name}</h3>
            <div className="docs-table-scroll" role="region" aria-label={`${name} fields`} tabIndex={0}>
              <table className="docs-table">
                <thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead>
                <tbody>{Object.entries(schema.properties || {}).map(([field, property]) => (
                  <tr key={field}>
                    <td><code>{field}</code><span className="docs-required">{schema.required?.includes(field) ? "required" : "optional"}</span></td>
                    <td><SchemaLink schema={property} /></td>
                    <td>{constraints(property) || "See the integration guide for usage."}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </section>
        ))}
      </section>
    </>
  );
}
