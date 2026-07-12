import { useEffect, useState } from 'react';
import { parseProductNames } from '../utils/parseProductNames';

interface ParsePreviewProps {
  rawName: string;
}

export default function ParsePreview({ rawName }: ParsePreviewProps) {
  const [products, setProducts] = useState<string[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setProducts(parseProductNames(rawName));
    }, 300);
    return () => clearTimeout(timer);
  }, [rawName]);

  if (!rawName.trim()) return null;

  return (
    <div className="parse-preview">
      {products.length > 0 ? (
        <>
          <span className="parse-label">
            → {products.length} product{products.length !== 1 ? 's' : ''}:
          </span>
          <span className="parse-names">{products.join(', ')}</span>
        </>
      ) : (
        <span className="parse-empty">No products parsed yet</span>
      )}
    </div>
  );
}
