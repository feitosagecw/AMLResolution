import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { AMLCase } from '../types/case';
import { fetchCases as fetchCasesApi } from '../services/casesService';

interface CasesContextType {
  cases: AMLCase[];
  loading: boolean;
  error: string | null;
  cached: boolean;
  cacheAge: number;
  refetch: () => void;
  refresh: () => void;
  removeCase: (userId: number) => void;
}

const CasesContext = createContext<CasesContextType | null>(null);

interface CasesProviderProps {
  children: ReactNode;
}

export function CasesProvider({ children }: CasesProviderProps) {
  const [cases, setCases] = useState<AMLCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);
  const [cacheAge, setCacheAge] = useState(0);
  const [lastFetch, setLastFetch] = useState<number>(0);

  const loadCases = useCallback(async (forceRefresh = false) => {
    // Se temos dados e a última busca foi há menos de 30 segundos, não recarrega
    // (a menos que seja forceRefresh)
    if (!forceRefresh && cases.length > 0 && Date.now() - lastFetch < 30000) {
      console.log('📦 Using frontend cache');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchCasesApi(forceRefresh);
      setCases(result.cases);
      setCached(result.cached);
      setCacheAge(result.cacheAge);
      setLastFetch(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cases');
      // Não limpa os casos em caso de erro para manter os dados anteriores
    } finally {
      setLoading(false);
    }
  }, [cases.length, lastFetch]);

  // Carrega os casos na inicialização
  useEffect(() => {
    loadCases();
  }, []);

  // Refetch sem forçar refresh
  const refetch = useCallback(() => {
    loadCases(false);
  }, [loadCases]);

  // Refresh forçando atualização
  const refresh = useCallback(() => {
    loadCases(true);
  }, [loadCases]);

  // Remove um caso da lista (após resolução)
  const removeCase = useCallback((userId: number) => {
    setCases(prev => prev.filter(c => c.user_id !== userId));
  }, []);

  return (
    <CasesContext.Provider value={{
      cases,
      loading,
      error,
      cached,
      cacheAge,
      refetch,
      refresh,
      removeCase,
    }}>
      {children}
    </CasesContext.Provider>
  );
}

export function useCasesContext(): CasesContextType {
  const context = useContext(CasesContext);
  if (!context) {
    throw new Error('useCasesContext must be used within a CasesProvider');
  }
  return context;
}

