import type { Entry } from '../types';
import EntryRow from './EntryRow';

interface EntryListProps {
  entries: Entry[];
  currentIndex: number;
  saving: boolean;
  onChange: (entries: Entry[]) => void;
  onIndexChange: (index: number) => void;
  onNextNew: () => void;
  onDeleteEntry: () => void;
  onCopyEntry: () => void;
}

export default function EntryList({
  entries,
  currentIndex,
  saving,
  onChange,
  onIndexChange,
  onNextNew,
  onDeleteEntry,
  onCopyEntry,
}: EntryListProps) {
  const entry = entries[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === entries.length - 1;
  const canDelete = entries.length > 1;

  const handleEntryChange = (_index: number, updated: Entry) => {
    const next = [...entries];
    next[currentIndex] = updated;
    onChange(next);
  };

  const handlePrevious = () => {
    if (!isFirst) onIndexChange(currentIndex - 1);
  };

  const handleNext = () => {
    if (isLast) {
      onNextNew();
    } else {
      onIndexChange(currentIndex + 1);
    }
  };

  if (!entry) return null;

  return (
    <section className="section entries-section">
      <div className="section-header">
        <h2>Product Entry</h2>
        <div className="entry-header-actions">
          <span className="entry-pagination-label">
            Entry {currentIndex + 1} of {entries.length}
          </span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onCopyEntry}
            disabled={saving}
          >
            Copy to Header
          </button>
          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={onDeleteEntry}
            disabled={!canDelete || saving}
            title={canDelete ? 'Delete this entry' : 'At least one entry is required'}
          >
            Delete Entry
          </button>
        </div>
      </div>

      <EntryRow
        entry={entry}
        index={currentIndex}
        onChange={handleEntryChange}
      />

      <div className="entry-pagination">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handlePrevious}
          disabled={isFirst || saving}
        >
          Previous
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleNext}
          disabled={saving}
          title="Alt+A"
        >
          {saving ? 'Saving…' : isLast ? 'Next (Save & New)' : 'Next'} (Alt+A)
        </button>
      </div>
    </section>
  );
}
