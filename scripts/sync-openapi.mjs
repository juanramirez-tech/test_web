#!/usr/bin/env node
/**
 * Sincroniza las paths del OpenAPI local contra src/app/core/api/openapi-paths.json
 * Uso: npm run sync:openapi  (API en :3000)
 */
const { writeFileSync } = require('node:fs');
const { resolve } = require('node:path');

const source = process.env.OPENAPI_URL || 'http://localhost:3000/docs.json';
const dest = resolve(__dirname, '../src/app/core/api/openapi-paths.json');

async function main() {
  const response = await fetch(source);
  if (!response.ok) {
    throw new Error(`No se pudo leer ${source}: ${response.status}`);
  }
  const spec = await response.json();
  const paths = Object.keys(spec.paths ?? {}).sort();
  const payload = {
    version: spec.info?.version ?? 'unknown',
    paths,
  };
  writeFileSync(dest, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(`OpenAPI ${payload.version}: ${paths.length} paths → ${dest}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
