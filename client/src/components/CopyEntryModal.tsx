import { useState } from 'react';
import { formatHeaderLabel, type Header } from '../types';

interface CopyEntryModalProps {
  open: boolean;
  headers: Header[];
  activeId?: number;
  saving: boolean;
  onClose: () => void;
  onCopy: (targetHeaderId: number) => void;
}

export default function CopyEntryModal({
  open,
  headers,
  activeId,
  saving,
  onClose,
  onCopy,
}: CopyEntryModalProps) {
  const [targetId, setTargetId] = useState<string>('');

  const targetHeaders = headers.filter(
    (header) => header.id !== undefined && header.id !== activeId,
  );

  if (!open) return null;

  const handleCopy = () => {
    const id = Number(targetId);
    if (!Number.isNaN(id)) onCopy(id);
  };

  const handleClose = () => {
    setTargetId('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Copy Entry to Another Header</h3>
        <p className="modal-description">
          The current entry will be added to the selected header. All entry fields
          including Name will be copied.
        </p>

        {targetHeaders.length === 0 ? (
          <p className="modal-empty">No other saved headers available.</p>
        ) : (
          <label className="field">
            <span>Target Header</span>
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              disabled={saving}
            >
              <option value="">Select header…</option>
              {targetHeaders.map((header) => (
                <option key={header.id} value={header.id}>
                  {formatHeaderLabel(header)}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleCopy}
            disabled={saving || !targetId || targetHeaders.length === 0}
          >
            {saving ? 'Copying…' : 'Copy Entry'}
          </button>
        </div>
      </div>
    </div>
  );
}
