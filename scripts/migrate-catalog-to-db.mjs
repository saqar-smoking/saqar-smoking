import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sql } from '@vercel/postgres';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const catalogPath = path.join(repoRoot, 'data', 'catalog.json');

const ensureDatabase = async () => {
  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL is not set. Add it in Vercel -> Project -> Settings -> Environment Variables before running the migration.');
  }

  await sql`CREATE TABLE IF NOT EXISTS catalog_store (key TEXT PRIMARY KEY, value JSONB NOT NULL);`;
};

const main = async () => {
  const raw = await fs.readFile(catalogPath, 'utf8');
  const catalog = JSON.parse(raw);

  if (!catalog || !Array.isArray(catalog.products)) {
    throw new Error('The catalog JSON is invalid or missing a products array.');
  }

  await ensureDatabase();

  await sql`
    INSERT INTO catalog_store (key, value)
    VALUES ('catalog', ${JSON.stringify(catalog)}::jsonb)
    ON CONFLICT (key)
    DO UPDATE SET value = EXCLUDED.value;
  `;

  console.log(`Migrated ${catalog.products.length} products to the live Postgres catalog store.`);
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
