import { useState, useEffect, useCallback, useRef } from 'react';
import { safeJson } from '../utils/safeFetch';
import type { Conformation, Fragment } from '../types';

type DockingStep = 'idle' | 'running' | 'results' | 'error';

interface StatusBody {
  status: string;
  conformations?: Conformation[];
  pose_pdb?: string;
  binding_affinity?: number;
  error?: string;
}

function normalizeConformations(statusBody: StatusBody): Conformation[] {
  if (Array.isArray(statusBody.conformations) && statusBody.conformations.length > 0) {
    return statusBody.conformations;
  }
  if (statusBody.status === 'done' && statusBody.pose_pdb) {
    return [
      {
        mode: 1,
        binding_affinity: statusBody.binding_affinity ?? 0,
        rmsd_lb: 0,
        rmsd_ub: 0,
        pose_pdb: statusBody.pose_pdb,
      },
    ];
  }
  return [];
}

/**
 * Orchestrates docking submission and status polling.
 */
export function useDockingJob(apiBase = '/api') {
  const [step, setStep] = useState<DockingStep>('idle');
  const [selectedFragment, setSelectedFragment] = useState<Fragment | null>(null);
  const [conformations, setConformations] = useState<Conformation[]>([]);
  const [activeConformation, setActiveConformation] = useState<Conformation | null>(null);
  const [jobError, setJobError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
      if (pollTimerRef.current != null) {
        clearTimeout(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, []);

  const clearPoll = useCallback(() => {
    if (pollTimerRef.current != null) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    clearPoll();
    setStep('idle');
    setSelectedFragment(null);
    setConformations([]);
    setActiveConformation(null);
    setJobError(null);
    setJobId(null);
  }, [clearPoll]);

  const selectFragment = useCallback((f: Fragment) => {
    setSelectedFragment(f);
  }, []);

  const setActiveConformationCb = useCallback((c: Conformation) => {
    setActiveConformation(c);
  }, []);

  const submitDocking = useCallback(
    async (pocketId: number, proteinPdbId: string, sourceType?: string) => {
      if (!selectedFragment?.smiles || !proteinPdbId) return;

      clearPoll();
      if (abortRef.current) {
        abortRef.current.abort();
      }
      abortRef.current = new AbortController();
      const { signal } = abortRef.current;

      setStep('running');
      setJobError(null);

      const submitTimeoutMs = 60000;
      const submitTimeout = setTimeout(() => abortRef.current?.abort(), submitTimeoutMs);

      try {
        const res = await fetch(`${apiBase}/dock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal,
          body: JSON.stringify({
            pocket_id: pocketId,
            source_type: sourceType || 'dimer',
            ligand_smiles: selectedFragment.smiles,
            protein_pdb_id: proteinPdbId,
          }),
        });
        clearTimeout(submitTimeout);

        if (!mountedRef.current) return;

        if (res.status !== 202) {
          const text = await res.text();
          setJobError(text || `HTTP ${res.status}`);
          setStep('error');
          return;
        }

        const body = await safeJson(res);
        if (!body) {
          setJobError('Server returned an empty response after docking submission');
          setStep('error');
          return;
        }
        const id = body.job_id;
        if (!id) {
          setJobError('Missing job_id from server');
          setStep('error');
          return;
        }
        setJobId(id);

        let delay = 2000;
        const maxDelay = 15000;

        const poll = async () => {
          if (!mountedRef.current) return;
          try {
            const st = await fetch(`${apiBase}/dock/status?id=${encodeURIComponent(id)}`, { signal });
            if (!st.ok) {
              const text = await st.text();
              setJobError(text || `HTTP ${st.status}`);
              setStep('error');
              return;
            }
            const result = await safeJson<StatusBody>(st);
            if (!result) {
              setJobError('Server returned an empty status response');
              setStep('error');
              return;
            }
            const status = result.status;

            if (status === 'done') {
              const confs = normalizeConformations(result);
              if (!confs.length) {
                setJobError('Docking finished but no poses were returned');
                setStep('error');
                return;
              }
              setConformations(confs);
              setActiveConformation(confs[0]);
              setStep('results');
              return;
            }

            if (status === 'error') {
              setJobError(result.error || 'Docking failed');
              setStep('error');
              return;
            }

            delay = Math.min(maxDelay, Math.round(delay * 1.5));
            pollTimerRef.current = setTimeout(poll, delay);
          } catch (e: unknown) {
            if (!mountedRef.current || (e instanceof Error && e.name === 'AbortError')) return;
            setJobError(e instanceof Error ? e.message : String(e));
            setStep('error');
          }
        };

        pollTimerRef.current = setTimeout(poll, delay);
      } catch (e: unknown) {
        clearTimeout(submitTimeout);
        if (!mountedRef.current || (e instanceof Error && e.name === 'AbortError')) return;
        setJobError(e instanceof Error ? e.message : String(e));
        setStep('error');
      }
    },
    [apiBase, clearPoll, selectedFragment]
  );

  return {
    step,
    selectedFragment,
    conformations,
    activeConformation,
    jobError,
    jobId,
    selectFragment,
    submitDocking,
    setActiveConformation: setActiveConformationCb,
    reset,
  };
}
