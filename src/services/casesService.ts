import type { AMLCase, CaseStats, UserInfo, ResolutionPriority } from '../types/case';
import { api, type ApiResult } from './api';

export interface CasesResult {
  cases: AMLCase[];
  cached: boolean;
  cacheAge: number;
}

/**
 * Busca todos os casos pendentes
 * @param forceRefresh - Se true, força atualização do cache no servidor
 */
export async function fetchCases(forceRefresh = false): Promise<CasesResult> {
  const endpoint = forceRefresh ? '/cases?refresh=true' : '/cases';
  const result = await api.get<AMLCase[]>(endpoint);
  
  return {
    cases: result.data,
    cached: result.cached,
    cacheAge: result.cacheAge,
  };
}

/**
 * Força atualização do cache no servidor
 */
export async function refreshCases(): Promise<AMLCase[]> {
  const result = await api.post<AMLCase[]>('/cases/refresh');
  return result.data;
}

/**
 * Busca estatísticas dos casos
 */
export async function fetchCaseStats(): Promise<ApiResult<CaseStats>> {
  return api.get<CaseStats>('/cases/stats');
}

/**
 * Busca um caso específico por user_id
 */
export async function fetchCaseByUserId(userId: number): Promise<AMLCase> {
  const result = await api.get<AMLCase>(`/cases/${userId}`);
  return result.data;
}

/**
 * Retorna analistas únicos dos casos
 */
export function getUniqueAnalysts(cases: AMLCase[]): string[] {
  return [...new Set(cases.map(c => c.analyst))].sort();
}

/**
 * Busca informações detalhadas do usuário associado ao caso
 */
export async function fetchUserInfo(userId: number): Promise<UserInfo> {
  const result = await api.get<UserInfo>(`/cases/${userId}/user-info`);
  return result.data;
}

// ============================================
// HISTÓRICO DE OFFENSES
// ============================================

export interface OffenseHistory {
  data_offense: string;
  conclusion: string | null;
  priority: string | null;
  description: string | null;
  analyst: string | null;
  offense_name: string | null;
}

/**
 * Busca histórico de offenses do usuário
 */
export async function fetchOffenseHistory(userId: number): Promise<OffenseHistory[]> {
  const result = await api.get<OffenseHistory[]>(`/cases/${userId}/offense-history`);
  return result.data;
}

// ============================================
// RESOLUÇÃO DE CASOS
// ============================================

export interface ResolutionPayload {
  user_id: number;
  conclusion: 'normal' | 'suspicious';
  priority: ResolutionPriority;
  description: string;
}

export interface ResolutionResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: unknown;
}

/**
 * Envia a resolução do caso para a API de Risk
 */
export async function sendResolution(payload: ResolutionPayload): Promise<ResolutionResponse> {
  return api.postRaw<ResolutionResponse>('/resolution', payload);
}
