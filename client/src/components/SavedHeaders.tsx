import { formatHeaderLabel, type Header } from '../types';

interface SavedHeadersProps {
  headers: Header[];
  activeId?: number;
  onSelect: (id: number) => void;
  onDelete: (id: number) => void;
}

export default function SavedHeaders({
  headers,
  activeId,
  onSelect,
  onDelete,
}: SavedHeadersProps) {
  if (headers.length === 0) {
    return (
      <aside className="sidebar">
        <h3>Saved Headers</h3>
        <p className="sidebar-empty">No saved headers yet</p>
      </aside>
    );
  }

  return (
    <aside className="sidebar">
      <h3>Saved Headers</h3>
      <ul className="saved-list">
        {headers.map((header) => (
          <li
            key={header.id}
            className={header.id === activeId ? 'active' : ''}
          >
            <button
              type="button"
              className="saved-item-btn"
              onClick={() => header.id && onSelect(header.id)}
            >
              {formatHeaderLabel(header)}
            </button>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => header.id && onDelete(header.id)}
              title="Delete header"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
