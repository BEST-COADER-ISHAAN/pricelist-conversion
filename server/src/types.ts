export interface Header {
  id?: number;
  size_mm: string;
  size_ft: string;
  pce_per_box: string;
  sqft_in_box_original: number | null;
  sqft_in_box_billed: number | null;
  weight: string;
  sp_unit: string;
  created_at?: string;
}

export interface Entry {
  id?: number;
  header_id?: number;
  raw_name: string;
  collection: string;
  surface: string;
  ex_factory: string;
  mrp_per_sqft: number | null;
  selling_price_per_sqft: number | null;
  selling_price_manual: boolean;
  products?: Product[];
}

export interface Product {
  id?: number;
  entry_id?: number;
  name: string;
}

export interface HeaderWithEntries extends Header {
  entries: Entry[];
}

export interface ExportRow {
  size_mm: string;
  size_ft: string;
  pce_per_box: string;
  sqft_in_box_original: number | null;
  sqft_in_box_billed: number | null;
  weight: string;
  sp_unit: string;
  product_name: string;
  collection: string;
  surface: string;
  ex_factory: string;
  mrp_per_sqft: number | null;
  selling_price_per_sqft: number | null;
}

export function calcSellingPrice(mrp: number): number {
  return Math.round(mrp * 0.65 * 100) / 100;
}

export function emptyHeader(): Header {
  return {
    size_mm: '',
    size_ft: '',
    pce_per_box: '',
    sqft_in_box_original: null,
    sqft_in_box_billed: null,
    weight: '',
    sp_unit: '',
  };
}

export function emptyEntry(): Entry {
  return {
    raw_name: '',
    collection: '',
    surface: '',
    ex_factory: '',
    mrp_per_sqft: null,
    selling_price_per_sqft: null,
    selling_price_manual: false,
  };
}
