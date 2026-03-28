import { useState, useCallback } from 'react';
import { API_BASE } from '../config';

// Module-level cache — persists across component mounts/unmounts
const searchCache = {};

export function useSearch() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [source, setSource] = useState(null);
  const [query, setQuery] = useState('');

  const search = useCallback(async (q) => {
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
      const body = await response.json();
      
      if (!response.ok) {
        throw new Error(body.message || 'Search failed');
      }

      const fetchedResults = body.data?.results || [];
      const fetchedSource = body.data?.source || null;

      // Store in cache
      searchCache[trimmedQuery] = { results: fetchedResults, source: fetchedSource };

      setResults(fetchedResults);
      setSource(fetchedSource);
    } catch (err) {
      setError(err.message || 'An error occurred during search.');
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
