import type { Header } from '../types';

interface HeaderFormProps {
  header: Header;
  onChange: (header: Header) => void;
}

const FIELDS: Array<{
  key: keyof Header;
  label: string;
  type: 'text' | 'number';
}> = [
  { key: 'size_mm', label: 'Size (mm)', type: 'text' },
  { key: 'size_ft', label: 'Size (Ft)', type: 'text' },
  { key: 'pce_per_box', label: 'Pce/Box', type: 'text' },
  { key: 'sqft_in_box_original', label: 'Sqft in Box (Original)', type: 'number' },
  { key: 'sqft_in_box_billed', label: 'Sqft in Box (Billed)', type: 'number' },
  { key: 'weight', label: 'Weight', type: 'text' },
];

const SP_UNIT_OPTIONS = ['Sqft', 'Pcs'] as const;

export default function HeaderForm({ header, onChange }: HeaderFormProps) {
  const handleChange = (key: keyof Header, value: string) => {
    if (key === 'sqft_in_box_original' || key === 'sqft_in_box_billed') {
      const num = value === '' ? null : Number(value);
      onChange({ ...header, [key]: num });
    } else {
      onChange({ ...header, [key]: value });
    }
  };

  return (
    <section className="section header-section">
      <h2>Header</h2>
      <div className="header-grid">
        {FIELDS.map(({ key, label, type }) => (
          <label key={key} className="field">
            <span>{label}</span>
            <input
              type={type}
              value={
                type === 'number'
                  ? header[key] ?? ''
                  : (header[key] as string)
              }
              onChange={(e) => handleChange(key, e.target.value)}
              step={type === 'number' ? 'any' : undefined}
            />
          </label>
        ))}

        <label className="field">
          <span>SP Unit</span>
          <select
            value={header.sp_unit}
            onChange={(e) => handleChange('sp_unit', e.target.value)}
          >
            <option value="">Select…</option>
            {SP_UNIT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
