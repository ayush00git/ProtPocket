import { useState, useCallback } from 'react';
import { API_BASE } from '../config';
import { safeJson } from '../utils/safeFetch';
import type { Complex } from '../types';

interface SearchCacheEntry {
  results: Complex[];
  source: string | null;
}

// Module-level cache — persists across component mounts/unmounts
const searchCache: Record<string, SearchCacheEntry> = {};

export function useSearch() {
  const [results, setResults] = useState<Complex[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const search = useCallback(async (q: string) => {
    const trimmedQuery = q?.trim();
    if (!trimmedQuery) return;

    setQuery(trimmedQuery);
    setError(null);

    // Check cache first
    if (searchCache[trimmedQuery]) {
      const cached = searchCache[trimmedQuery];
      setResults(cached.results);
      setSource(cached.source);
      return;
    }

    setLoading(true);
    setSource(null);

    try {
      const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(trimmedQuery)}`);
      const body = await safeJson(response);

      if (!response.ok) {
        throw new Error(body?.message || `Search failed (HTTP ${response.status})`);
      }

      if (!body) {
        throw new Error('Server returned an empty response');
      }

      const fetchedResults = body.results || [];
      const fetchedSource = body.source || null;

      // Store in cache
      searchCache[trimmedQuery] = { results: fetchedResults, source: fetchedSource };

      setResults(fetchedResults);
      setSource(fetchedSource);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred during search.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = () => {
    setResults([]);
    setLoading(false);
    setError(null);
    setSource(null);
    setQuery('');
  };

  return { search, clear, results, loading, error, source, query };
}
