import { useState, useCallback, useRef } from 'react';
import { API_BASE } from '../config';

const searchCache = {};

export function useSearch() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [source, setSource] = useState(null);
  const [query, setQuery] = useState('');
  const esRef = useRef(null);

  const search = useCallback((q) => {
    const trimmedQuery = q?.trim();
    if (!trimmedQuery) return;

    // Close any in-flight stream before starting a new one
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }

    setQuery(trimmedQuery);
    setError(null);
    setResults([]);
    setSource(null);

    if (searchCache[trimmedQuery]) {
      const cached = searchCache[trimmedQuery];
      setResults(cached.results);
      setSource(cached.source);
      return;
    }

    setLoading(true);
    const accumulated = [];

    const es = new EventSource(`${API_BASE}/search?q=${encodeURIComponent(trimmedQuery)}`);
    esRef.current = es;

    es.addEventListener('result', (e) => {
      const protein = JSON.parse(e.data);
      accumulated.push(protein);
      setResults((prev) => [...prev, protein]);
    });

    es.addEventListener('done', (e) => {
      const { source: src } = JSON.parse(e.data);
      // Sort by gap score descending once all results have arrived
      const sorted = [...accumulated].sort((a, b) => (b.gap_score ?? 0) - (a.gap_score ?? 0));
      searchCache[trimmedQuery] = { results: sorted, source: src };
      setResults(sorted);
      setSource(src);
      setLoading(false);
      es.close();
      esRef.current = null;
    });

    es.addEventListener('error', (e) => {
      if (e.data) {
        const { error: msg } = JSON.parse(e.data);
        setError(msg || 'Search failed.');
      } else {
        setError('Search failed. Please try again.');
      }
      setLoading(false);
      es.close();
      esRef.current = null;
    });

    // Fallback: native onerror fires when the connection drops unexpectedly
    es.onerror = () => {
      if (esRef.current) {
        setError('Search connection lost. Please try again.');
        setLoading(false);
        es.close();
        esRef.current = null;
      }
    };
  }, []);

  const clear = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
    setResults([]);
    setLoading(false);
    setError(null);
    setSource(null);
    setQuery('');
  }, []);

  return { search, clear, results, loading, error, source, query };
}
