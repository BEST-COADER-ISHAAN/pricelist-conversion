import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseProductNames } from './parseProductNames.js';
import type { Entry, ExportRow, Header, HeaderWithEntries } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'pricelist.db');
const db = new Database(dbPath);

db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS headers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    size_mm TEXT NOT NULL DEFAULT '',
    size_ft TEXT NOT NULL DEFAULT '',
    pce_per_box TEXT NOT NULL DEFAULT '',
    sqft_in_box_original REAL,
    sqft_in_box_billed REAL,
    weight TEXT NOT NULL DEFAULT '',
    sp_unit TEXT NOT NULL DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    header_id INTEGER NOT NULL,
    raw_name TEXT NOT NULL DEFAULT '',
    collection TEXT NOT NULL DEFAULT '',
    surface TEXT NOT NULL DEFAULT '',
    ex_factory TEXT NOT NULL DEFAULT '',
    mrp_per_sqft REAL,
    selling_price_per_sqft REAL,
    selling_price_manual INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (header_id) REFERENCES headers(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entry_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE
  );
`);

interface HeaderRow {
  id: number;
  size_mm: string;
  size_ft: string;
  pce_per_box: string;
  sqft_in_box_original: number | null;
  sqft_in_box_billed: number | null;
  weight: string;
  sp_unit: string;
  created_at: string;
}

interface EntryRow {
  id: number;
  header_id: number;
  raw_name: string;
  collection: string;
  surface: string;
  ex_factory: string;
  mrp_per_sqft: number | null;
  selling_price_per_sqft: number | null;
  selling_price_manual: number;
}

interface ProductRow {
  id: number;
  entry_id: number;
  name: string;
}

function mapHeader(row: HeaderRow): Header {
  return {
    id: row.id,
    size_mm: row.size_mm,
    size_ft: row.size_ft,
    pce_per_box: row.pce_per_box,
    sqft_in_box_original: row.sqft_in_box_original,
    sqft_in_box_billed: row.sqft_in_box_billed,
    weight: row.weight,
    sp_unit: row.sp_unit,
    created_at: row.created_at,
  };
}

function mapEntry(row: EntryRow, products: ProductRow[] = []): Entry {
  return {
    id: row.id,
    header_id: row.header_id,
    raw_name: row.raw_name,
    collection: row.collection,
    surface: row.surface,
    ex_factory: row.ex_factory,
    mrp_per_sqft: row.mrp_per_sqft,
    selling_price_per_sqft: row.selling_price_per_sqft,
    selling_price_manual: row.selling_price_manual === 1,
    products: products.map((p) => ({ id: p.id, entry_id: p.entry_id, name: p.name })),
  };
}

export function listHeaders(): Header[] {
  const rows = db.prepare('SELECT * FROM headers ORDER BY created_at DESC').all() as HeaderRow[];
  return rows.map(mapHeader);
}

export function getHeader(id: number): HeaderWithEntries | null {
  const headerRow = db.prepare('SELECT * FROM headers WHERE id = ?').get(id) as HeaderRow | undefined;
  if (!headerRow) return null;

  const entryRows = db
    .prepare('SELECT * FROM entries WHERE header_id = ? ORDER BY id')
    .all(id) as EntryRow[];

  const getProducts = db.prepare('SELECT * FROM products WHERE entry_id = ? ORDER BY id');

  const entries = entryRows.map((entryRow) => {
    const productRows = getProducts.all(entryRow.id) as ProductRow[];
    return mapEntry(entryRow, productRows);
  });

  return { ...mapHeader(headerRow), entries };
}

export function createHeader(header: Header, entries: Entry[]): HeaderWithEntries {
  const insertHeader = db.prepare(`
    INSERT INTO headers (size_mm, size_ft, pce_per_box, sqft_in_box_original, sqft_in_box_billed, weight, sp_unit)
    VALUES (@size_mm, @size_ft, @pce_per_box, @sqft_in_box_original, @sqft_in_box_billed, @weight, @sp_unit)
  `);

  const insertEntry = db.prepare(`
    INSERT INTO entries (header_id, raw_name, collection, surface, ex_factory, mrp_per_sqft, selling_price_per_sqft, selling_price_manual)
    VALUES (@header_id, @raw_name, @collection, @surface, @ex_factory, @mrp_per_sqft, @selling_price_per_sqft, @selling_price_manual)
  `);

  const insertProduct = db.prepare(`
    INSERT INTO products (entry_id, name) VALUES (@entry_id, @name)
  `);

  const tx = db.transaction(() => {
    const headerResult = insertHeader.run({
      size_mm: header.size_mm,
      size_ft: header.size_ft,
      pce_per_box: header.pce_per_box,
      sqft_in_box_original: header.sqft_in_box_original,
      sqft_in_box_billed: header.sqft_in_box_billed,
      weight: header.weight,
      sp_unit: header.sp_unit,
    });

    const headerId = Number(headerResult.lastInsertRowid);

    for (const entry of entries) {
      const entryResult = insertEntry.run({
        header_id: headerId,
        raw_name: entry.raw_name,
        collection: entry.collection,
        surface: entry.surface,
        ex_factory: entry.ex_factory,
        mrp_per_sqft: entry.mrp_per_sqft,
        selling_price_per_sqft: entry.selling_price_per_sqft,
        selling_price_manual: entry.selling_price_manual ? 1 : 0,
      });

      const entryId = Number(entryResult.lastInsertRowid);
      const productNames = parseProductNames(entry.raw_name);

      for (const name of productNames) {
        insertProduct.run({ entry_id: entryId, name });
      }
    }

    return headerId;
  });

  const headerId = tx();
  return getHeader(headerId)!;
}

export function updateHeader(id: number, header: Header, entries: Entry[]): HeaderWithEntries | null {
  const existing = getHeader(id);
  if (!existing) return null;

  const updateHeaderStmt = db.prepare(`
    UPDATE headers SET
      size_mm = @size_mm,
      size_ft = @size_ft,
      pce_per_box = @pce_per_box,
      sqft_in_box_original = @sqft_in_box_original,
      sqft_in_box_billed = @sqft_in_box_billed,
      weight = @weight,
      sp_unit = @sp_unit
    WHERE id = @id
  `);

  const insertEntry = db.prepare(`
    INSERT INTO entries (header_id, raw_name, collection, surface, ex_factory, mrp_per_sqft, selling_price_per_sqft, selling_price_manual)
    VALUES (@header_id, @raw_name, @collection, @surface, @ex_factory, @mrp_per_sqft, @selling_price_per_sqft, @selling_price_manual)
  `);

  const insertProduct = db.prepare(`
    INSERT INTO products (entry_id, name) VALUES (@entry_id, @name)
  `);

  const deleteEntries = db.prepare('DELETE FROM entries WHERE header_id = ?');

  const tx = db.transaction(() => {
    updateHeaderStmt.run({
      id,
      size_mm: header.size_mm,
      size_ft: header.size_ft,
      pce_per_box: header.pce_per_box,
      sqft_in_box_original: header.sqft_in_box_original,
      sqft_in_box_billed: header.sqft_in_box_billed,
      weight: header.weight,
      sp_unit: header.sp_unit,
    });

    deleteEntries.run(id);

    for (const entry of entries) {
      const entryResult = insertEntry.run({
        header_id: id,
        raw_name: entry.raw_name,
        collection: entry.collection,
        surface: entry.surface,
        ex_factory: entry.ex_factory,
        mrp_per_sqft: entry.mrp_per_sqft,
        selling_price_per_sqft: entry.selling_price_per_sqft,
        selling_price_manual: entry.selling_price_manual ? 1 : 0,
      });

      const entryId = Number(entryResult.lastInsertRowid);
      const productNames = parseProductNames(entry.raw_name);

      for (const name of productNames) {
        insertProduct.run({ entry_id: entryId, name });
      }
    }
  });

  tx();
  return getHeader(id);
}

export function deleteHeader(id: number): boolean {
  const result = db.prepare('DELETE FROM headers WHERE id = ?').run(id);
  return result.changes > 0;
}

export function getExportRows(headerId?: number): ExportRow[] {
  let query = `
    SELECT
      h.size_mm, h.size_ft, h.pce_per_box,
      h.sqft_in_box_original, h.sqft_in_box_billed,
      h.weight, h.sp_unit,
      p.name AS product_name,
      e.collection, e.surface, e.ex_factory,
      e.mrp_per_sqft, e.selling_price_per_sqft
    FROM products p
    JOIN entries e ON e.id = p.entry_id
    JOIN headers h ON h.id = e.header_id
  `;

  const params: number[] = [];
  if (headerId !== undefined) {
    query += ' WHERE h.id = ?';
    params.push(headerId);
  }

  query += ' ORDER BY h.id, e.id, p.id';

  return db.prepare(query).all(...params) as ExportRow[];
}

export default db;
