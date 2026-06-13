import { useState, useCallback, useRef } from 'react';
import { API_BASE } from '../config';

interface Protein {
  gap_score?: number;
  gene_name?: string;
  protein_name?: string;
  organism?: string;
  [key: string]: unknown;
}

// Relevance bucket: lower is a better match for the typed query.
// 0 = exact gene symbol, 1 = gene starts-with, 2 = name contains, 3 = other.
function relevanceRank(p: Protein, q: string): number {
  const query = q.toLowerCase();
  const gene = (p.gene_name ?? '').toLowerCase();
  const name = (p.protein_name ?? '').toLowerCase();
  if (gene === query) return 0;
  if (gene.startsWith(query)) return 1;
  if (gene.includes(query) || name.includes(query)) return 2;
  return 3;
}

// Order results by query relevance first, then GapScore (druggability priority)
// as a secondary signal, with a gentle nudge toward human entries on exact ties.
function rankResults(results: Protein[], q: string): Protein[] {
  return [...results].sort((a, b) => {
    const ra = relevanceRank(a, q);
    const rb = relevanceRank(b, q);
    if (ra !== rb) return ra - rb;

    const aHuman = (a.organism ?? '').toLowerCase().includes('homo sapiens');
    const bHuman = (b.organism ?? '').toLowerCase().includes('homo sapiens');
    if (aHuman !== bHuman) return aHuman ? -1 : 1;

    return (b.gap_score ?? 0) - (a.gap_score ?? 0);
  });
}

interface CacheEntry {
  results: Protein[];
  source: string;
}

interface UseSearchReturn {
  search: (q: string) => void;
  clear: () => void;
  results: Protein[];
  loading: boolean;
  error: string | null;
  source: string | null;
  query: string;
}

const searchCache: Record<string, CacheEntry> = {};

export function useSearch(): UseSearchReturn {
  const [results, setResults] = useState<Protein[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const esRef = useRef<EventSource | null>(null);

  const search = useCallback((q: string) => {
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
    const accumulated: Protein[] = [];

    const es = new EventSource(`${API_BASE}/search?q=${encodeURIComponent(trimmedQuery)}`);
    esRef.current = es;

    es.addEventListener('result', (e: MessageEvent) => {
      const protein: Protein = JSON.parse(e.data);
      accumulated.push(protein);
      setResults((prev) => [...prev, protein]);
    });

    es.addEventListener('done', (e: MessageEvent) => {
      const { source: src }: { source: string } = JSON.parse(e.data);
      // Rank by query relevance first, GapScore as a secondary signal.
      const sorted = rankResults(accumulated, trimmedQuery);
      searchCache[trimmedQuery] = { results: sorted, source: src };
      setResults(sorted);
      setSource(src);
      setLoading(false);
      es.close();
      esRef.current = null;
    });

    es.addEventListener('error', (e: MessageEvent) => {
      if (e.data) {
        const { error: msg }: { error?: string } = JSON.parse(e.data);
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
