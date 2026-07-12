import type { Entry } from '../types';
import { calcSellingPrice } from '../types';
import ParsePreview from './ParsePreview';

interface EntryRowProps {
  entry: Entry;
  index: number;
  onChange: (index: number, entry: Entry) => void;
}

export default function EntryRow({ entry, index, onChange }: EntryRowProps) {
  const update = (partial: Partial<Entry>) => {
    onChange(index, { ...entry, ...partial });
  };

  const handleMrpChange = (value: string) => {
    const num = value === '' ? null : Number(value);
    const partial: Partial<Entry> = { mrp_per_sqft: num };
    if (!entry.selling_price_manual && num !== null && !Number.isNaN(num)) {
      partial.selling_price_per_sqft = calcSellingPrice(num);
    } else if (!entry.selling_price_manual && num === null) {
      partial.selling_price_per_sqft = null;
    }
    update(partial);
  };

  const handleSellingPriceChange = (value: string) => {
    const num = value === '' ? null : Number(value);
    update({ selling_price_per_sqft: num, selling_price_manual: true });
  };

  const handleResetFormula = () => {
    if (entry.mrp_per_sqft !== null && !Number.isNaN(entry.mrp_per_sqft)) {
      update({
        selling_price_per_sqft: calcSellingPrice(entry.mrp_per_sqft),
        selling_price_manual: false,
      });
    }
  };

  return (
    <div className="entry-row">
      <div className="entry-grid">
        <label className="field field-wide">
          <span>Name</span>
          <textarea
            rows={3}
            value={entry.raw_name}
            onChange={(e) => update({ raw_name: e.target.value })}
            placeholder='e.g. SPECTRA (Cheese, Mushroom) or Bardiglo Rift, Bruno Rainforest'
          />
          <ParsePreview rawName={entry.raw_name} />
        </label>

        <label className="field">
          <span>Collection</span>
          <input
            type="text"
            value={entry.collection}
            onChange={(e) => update({ collection: e.target.value })}
          />
        </label>

        <label className="field">
          <span>Surface</span>
          <input
            type="text"
            value={entry.surface}
            onChange={(e) => update({ surface: e.target.value })}
          />
        </label>

        <label className="field">
          <span>EX-Factory</span>
          <input
            type="text"
            value={entry.ex_factory}
            onChange={(e) => update({ ex_factory: e.target.value })}
          />
        </label>

        <label className="field">
          <span>MRP/Sqft</span>
          <input
            type="number"
            step="any"
            value={entry.mrp_per_sqft ?? ''}
            onChange={(e) => handleMrpChange(e.target.value)}
          />
        </label>

        <label className="field">
          <span>Selling Price/Sqft</span>
          <input
            type="number"
            step="any"
            value={entry.selling_price_per_sqft ?? ''}
            onChange={(e) => handleSellingPriceChange(e.target.value)}
          />
          {entry.selling_price_manual && (
            <button
              type="button"
              className="link-btn"
              onClick={handleResetFormula}
            >
              Reset to formula
            </button>
          )}
        </label>
      </div>
    </div>
  );
}
