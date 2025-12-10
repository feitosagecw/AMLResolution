import { useState, useEffect, useCallback } from 'react';
import type { AMLCase, CaseStats, UserInfo } from '../types/case';
import { fetchCases, fetchCaseStats, fetchCaseByUserId, fetchUserInfo } from '../services/casesService';

interface UseCasesResult {
  cases: AMLCase[];
  loading: boolean;
  error: string | null;
  cached: boolean;
  cacheAge: number;
  refetch: () => void;
  refresh: () => void;
}

interface UseCaseStatsResult {
  stats: CaseStats | null;
  loading: boolean;
  error: string | null;
  cached: boolean;
}

interface UseCaseDetailResult {
  caseData: AMLCase | null;
  loading: boolean;
  error: string | null;
}

interface UseUserInfoResult {
  userInfo: UserInfo | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook para buscar todos os casos
 */
export function useCases(): UseCasesResult {
  const [cases, setCases] = useState<AMLCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);
  const [cacheAge, setCacheAge] = useState(0);

  const loadCases = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchCases(forceRefresh);
      setCases(result.cases);
      setCached(result.cached);
      setCacheAge(result.cacheAge);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cases');
      setCases([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  // Refetch sem forçar refresh (usa cache se disponível)
  const refetch = useCallback(() => {
    loadCases(false);
  }, [loadCases]);

  // Refresh forçando atualização do cache
  const refresh = useCallback(() => {
    loadCases(true);
  }, [loadCases]);

  return { cases, loading, error, cached, cacheAge, refetch, refresh };
}

/**
 * Hook para buscar estatísticas
 */
export function useCaseStats(): UseCaseStatsResult {
  const [stats, setStats] = useState<CaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      setError(null);
      
      try {
        const result = await fetchCaseStats();
        setStats(result.data);
        setCached(result.cached);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stats');
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  return { stats, loading, error, cached };
}

/**
 * Hook para buscar um caso específico
 */
export function useCaseDetail(userId: number | undefined): UseCaseDetailResult {
  const [caseData, setCaseData] = useState<AMLCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCase() {
      if (!userId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        const data = await fetchCaseByUserId(userId);
        setCaseData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load case');
        setCaseData(null);
      } finally {
        setLoading(false);
      }
    }

    loadCase();
  }, [userId]);

  return { caseData, loading, error };
}

/**
 * Hook para buscar informações detalhadas do usuário
 */
export function useUserInfo(userId: number | undefined): UseUserInfoResult {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUserInfo = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchUserInfo(userId);
      setUserInfo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar informações do usuário');
      setUserInfo(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadUserInfo();
  }, [loadUserInfo]);

  const refetch = useCallback(() => {
    loadUserInfo();
  }, [loadUserInfo]);

  return { userInfo, loading, error, refetch };
}
