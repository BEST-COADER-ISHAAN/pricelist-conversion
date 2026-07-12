import { useCallback, useEffect, useState } from 'react';
import {
  deleteHeader as apiDeleteHeader,
  exportExcel,
  fetchHeader,
  fetchHeaders,
  saveHeader,
} from './api/client';
import HeaderForm from './components/HeaderForm';
import EntryList from './components/EntryList';
import SavedHeaders from './components/SavedHeaders';
import CopyEntryModal from './components/CopyEntryModal';
import {
  cloneEntry,
  emptyEntry,
  emptyHeader,
  formatHeaderLabel,
  prefillEntryFrom,
  type Entry,
  type Header,
} from './types';

export default function App() {
  const [header, setHeader] = useState<Header>(emptyHeader());
  const [entries, setEntries] = useState<Entry[]>([emptyEntry()]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [savedHeaders, setSavedHeaders] = useState<Header[]>([]);
  const [activeId, setActiveId] = useState<number | undefined>();
  const [status, setStatus] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [copyModalOpen, setCopyModalOpen] = useState(false);

  const loadSavedList = useCallback(async () => {
    try {
      const list = await fetchHeaders();
      setSavedHeaders(list);
    } catch {
      setStatus('Failed to load saved headers');
    }
  }, []);

  useEffect(() => {
    loadSavedList();
  }, [loadSavedList]);

  const persistHeader = useCallback(
    async (entriesToSave: Entry[]) => {
      const saved = await saveHeader(header, entriesToSave, activeId);
      setActiveId(saved.id);
      setHeader((prev) => ({ ...prev, id: saved.id, created_at: saved.created_at }));
      await loadSavedList();
      return saved;
    },
    [header, activeId, loadSavedList],
  );

  const handleLoad = async (id: number) => {
    try {
      const data = await fetchHeader(id);
      setHeader({
        id: data.id,
        size_mm: data.size_mm,
        size_ft: data.size_ft,
        pce_per_box: data.pce_per_box,
        sqft_in_box_original: data.sqft_in_box_original,
        sqft_in_box_billed: data.sqft_in_box_billed,
        weight: data.weight,
        sp_unit: data.sp_unit,
        created_at: data.created_at,
      });
      setEntries(
        data.entries.length > 0
          ? data.entries.map((e) => ({
              id: e.id,
              header_id: e.header_id,
              raw_name: e.raw_name,
              collection: e.collection,
              surface: e.surface,
              ex_factory: e.ex_factory,
              mrp_per_sqft: e.mrp_per_sqft,
              selling_price_per_sqft: e.selling_price_per_sqft,
              selling_price_manual: e.selling_price_manual,
            }))
          : [emptyEntry()],
      );
      setCurrentIndex(0);
      setActiveId(id);
      setStatus('Header loaded');
    } catch {
      setStatus('Failed to load header');
    }
  };

  const handleNew = () => {
    setHeader(emptyHeader());
    setEntries([emptyEntry()]);
    setCurrentIndex(0);
    setActiveId(undefined);
    setStatus('New header started');
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus('');
    try {
      await persistHeader(entries);
      setStatus('Saved successfully');
    } catch {
      setStatus('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleNextNew = async () => {
    const currentEntry = entries[currentIndex];
    setSaving(true);
    setStatus('');
    try {
      await persistHeader(entries);
      const newEntry = prefillEntryFrom(currentEntry);
      const nextEntries = [...entries, newEntry];
      setEntries(nextEntries);
      setCurrentIndex(nextEntries.length - 1);
      setStatus('Entry saved — new entry ready with prefilled values');
    } catch {
      setStatus('Failed to save entry');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndNext = useCallback(async () => {
    if (saving) return;

    const currentEntry = entries[currentIndex];
    const isLast = currentIndex === entries.length - 1;

    setSaving(true);
    setStatus('');
    try {
      await persistHeader(entries);
      if (isLast) {
        const newEntry = prefillEntryFrom(currentEntry);
        const nextEntries = [...entries, newEntry];
        setEntries(nextEntries);
        setCurrentIndex(nextEntries.length - 1);
        setStatus('Entry saved — new entry ready with prefilled values');
      } else {
        setCurrentIndex(currentIndex + 1);
        setStatus('Saved — moved to next entry');
      }
    } catch {
      setStatus('Failed to save entry');
    } finally {
      setSaving(false);
    }
  }, [saving, entries, currentIndex, persistHeader]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        handleSaveAndNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSaveAndNext]);

  const handleDeleteEntry = async () => {
    if (entries.length <= 1) return;
    if (!confirm('Delete this entry?')) return;

    const nextEntries = entries.filter((_, i) => i !== currentIndex);
    const nextIndex = Math.min(currentIndex, nextEntries.length - 1);

    setEntries(nextEntries);
    setCurrentIndex(nextIndex);

    if (activeId) {
      setSaving(true);
      setStatus('');
      try {
        await persistHeader(nextEntries);
        setStatus('Entry deleted');
      } catch {
        setStatus('Failed to delete entry');
      } finally {
        setSaving(false);
      }
    } else {
      setStatus('Entry deleted');
    }
  };

  const handleCopyToHeader = async (targetHeaderId: number) => {
    setSaving(true);
    setStatus('');
    try {
      const target = await fetchHeader(targetHeaderId);
      const copiedEntry = cloneEntry(entries[currentIndex]);
      const targetEntries = target.entries.map((entry) => ({
        raw_name: entry.raw_name,
        collection: entry.collection,
        surface: entry.surface,
        ex_factory: entry.ex_factory,
        mrp_per_sqft: entry.mrp_per_sqft,
        selling_price_per_sqft: entry.selling_price_per_sqft,
        selling_price_manual: entry.selling_price_manual,
      }));
      await saveHeader(target, [...targetEntries, copiedEntry], targetHeaderId);
      setCopyModalOpen(false);
      setStatus(`Entry copied to ${formatHeaderLabel(target)}`);
      await loadSavedList();
    } catch {
      setStatus('Failed to copy entry');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this header and all its entries?')) return;
    try {
      await apiDeleteHeader(id);
      if (activeId === id) handleNew();
      await loadSavedList();
      setStatus('Header deleted');
    } catch {
      setStatus('Failed to delete header');
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Pricelist Conversion</h1>
        <p className="subtitle">
          Enter header specs and product names — export to Excel when ready
        </p>
      </header>

      <div className="layout">
        <SavedHeaders
          headers={savedHeaders}
          activeId={activeId}
          onSelect={handleLoad}
          onDelete={handleDelete}
        />

        <main className="main-content">
          <HeaderForm header={header} onChange={setHeader} />
          <EntryList
            entries={entries}
            currentIndex={currentIndex}
            saving={saving}
            onChange={setEntries}
            onIndexChange={setCurrentIndex}
            onNextNew={handleNextNew}
            onDeleteEntry={handleDeleteEntry}
            onCopyEntry={() => setCopyModalOpen(true)}
          />

          <CopyEntryModal
            open={copyModalOpen}
            headers={savedHeaders}
            activeId={activeId}
            saving={saving}
            onClose={() => setCopyModalOpen(false)}
            onCopy={handleCopyToHeader}
          />

          <div className="actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={handleNew}>
              New Header
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => exportExcel(activeId)}
            >
              Export Current
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => exportExcel()}
            >
              Export All
            </button>
          </div>

          {status && <p className="status-message">{status}</p>}
        </main>
      </div>
    </div>
  );
}
