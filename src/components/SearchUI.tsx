import React, { useState, useCallback, useMemo } from 'react';
import Fuse from 'fuse.js';
import { ComposerNode } from '../data/database';

interface SearchUIProps {
  composers: ComposerNode[];
  onSelect: (composer: ComposerNode) => void;
  isActive: boolean;
  onClose: () => void;
}

export const SearchUI: React.FC<SearchUIProps> = ({
  composers,
  onSelect,
  isActive,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ComposerNode[]>([]);

  // Инициализируем Fuse.js с опциями
  const fuse = useMemo(
    () =>
      new Fuse(composers, {
        keys: [
          { name: 'label', weight: 0.7 }, // имя выше всех
          { name: 'era', weight: 0.3 }, // эпоха ниже
        ],
        threshold: 0.3, // чувствительность поиска
        includeScore: true,
      }),
    [composers]
  );

  // Дебаунс поиска (150ms)
  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const q = e.target.value;
      setQuery(q);

      if (q.trim().length === 0) {
        setResults([]);
        return;
      }

      const searchResults = fuse.search(q);
      setResults(searchResults.map((r) => r.item).slice(0, 8)); // max 8 результатов
    },
    [fuse]
  );

  const handleSelectComposer = (composer: ComposerNode) => {
    onSelect(composer);
    setQuery('');
    setResults([]);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setQuery('');
      setResults([]);
      onClose();
    }
  };

  if (!isActive) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(10, 10, 10, 0.95)',
        backdropFilter: 'blur(10px)',
        padding: '24px',
      }}
    >
      <div
        style={{
          maxWidth: '600px',
          margin: '0 auto',
        }}
      >
        {/* Search Input */}
        <input
          type="text"
          placeholder="Search composer by name or era..."
          value={query}
          onChange={handleSearch}
          onKeyDown={handleKeyDown}
          autoFocus
          style={{
            width: '100%',
            padding: '12px 16px',
            fontSize: '16px',
            backgroundColor: '#1a1a1a',
            border: '1px solid #444',
            borderRadius: '8px',
            color: '#e5e5e5',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#d4af37';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#444';
          }}
        />

        {/* Results List */}
        {results.length > 0 && (
          <div
            style={{
              marginTop: '8px',
              backgroundColor: '#0a0a0a',
              border: '1px solid #333',
              borderRadius: '8px',
              maxHeight: '400px',
              overflowY: 'auto',
            }}
          >
            {results.map((composer) => (
              <button
                key={composer.id}
                onClick={() => handleSelectComposer(composer)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid #222',
                  color: '#e5e5e5',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s',
                  fontSize: '14px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                  {composer.label}
                </div>
                <div style={{ fontSize: '12px', color: '#999' }}>
                  {composer.era} • {composer.lifeDates}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* No Results Message */}
        {query.trim().length > 0 && results.length === 0 && (
          <div
            style={{
              marginTop: '8px',
              padding: '16px',
              textAlign: 'center',
              color: '#666',
              fontSize: '14px',
            }}
          >
            No composers found for "{query}"
          </div>
        )}
      </div>

      {/* Close hint */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          right: '16px',
          fontSize: '12px',
          color: '#666',
        }}
      >
        Press <kbd>ESC</kbd> to close
      </div>
    </div>
  );
};
