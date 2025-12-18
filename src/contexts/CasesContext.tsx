import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
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
  const lastFetchRef = useRef<number>(0);
  const isInitializedRef = useRef(false);
  const casesLengthRef = useRef<number>(0);

  // Atualiza a ref quando cases muda
  useEffect(() => {
    casesLengthRef.current = cases.length;
  }, [cases.length]);

  const loadCases = useCallback(async (forceRefresh = false) => {
    // Se temos dados e a última busca foi há menos de 30 segundos, não recarrega
    // (a menos que seja forceRefresh)
    const now = Date.now();
    if (!forceRefresh && casesLengthRef.current > 0 && now - lastFetchRef.current < 30000) {
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
      lastFetchRef.current = now;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load cases';
      setError(errorMessage);
      console.error('Erro ao carregar casos:', err);
      // Não limpa os casos em caso de erro para manter os dados anteriores
    } finally {
      setLoading(false);
      isInitializedRef.current = true;
    }
  }, []);

  // Carrega os casos na inicialização
  useEffect(() => {
    if (!isInitializedRef.current) {
      loadCases().catch(err => {
        console.error('Erro na inicialização do CasesContext:', err);
        setError('Erro ao carregar casos iniciais');
        setLoading(false);
        isInitializedRef.current = true;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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







