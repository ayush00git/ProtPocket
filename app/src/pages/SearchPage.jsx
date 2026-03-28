import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchBar } from '../components/search/SearchBar';
import { ResultCard } from '../components/search/ResultCard';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { useSearch } from '../hooks/useSearch';

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const { search, results, loading, error, source, query } = useSearch();

  useEffect(() => {
    if (q) {
      search(q);
    }
  }, [q]);

  const handleSearch = (newQuery) => {
    setSearchParams({ q: newQuery });
  };

  const hasSearched = !!query;
  const hasResults = results.length > 0;

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full max-w-[1000px] px-6 py-[48px] flex flex-col gap-8">
        <SearchBar onSearch={handleSearch} loading={loading} initialValue={q} />

        {loading && <LoadingState message="Querying AlphaFold + ChEMBL..." />}
        
        {error && <ErrorState message={error} />}

        {!loading && !error && hasSearched && (
          <div className="flex flex-col gap-4">
            {hasResults ? (
              <>
                <div className="font-mono text-[11px] text-text-muted tracking-wider uppercase border-b border-border pb-2 flex justify-between">
                  <span>{results.length} results for "{query}"</span>
                  <span>source: {source}</span>
                </div>
                <div className="flex flex-col gap-3">
                  {results.map((complex) => (
                    <ResultCard key={complex.uniprot_id} complex={complex} />
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center text-center py-16 gap-4">
                <span className="font-mono text-sm text-text-muted">
                  No targets found matching "{query}"
                </span>
                <span className="text-text-secondary text-sm">
                  Try adjusting your search terms or exploring the dashboard.
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
