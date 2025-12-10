import type { AMLCase } from '../types/case';

const analysts = [
  'Maria Santos',
  'João Silva',
  'Ana Costa',
  'Pedro Oliveira',
  'Carla Mendes',
  'Lucas Ferreira',
  'Julia Almeida',
  'Rafael Souza'
];

const statuses: AMLCase['status'][] = ['active', 'blocked', 'pending', 'suspended', 'inactive'];

// Seeded random para consistência
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateMockCases(count: number): AMLCase[] {
  const cases: AMLCase[] = [];
  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
  const timeRange = now.getTime() - sixMonthsAgo.getTime();

  for (let i = 0; i < count; i++) {
    const seed = i + 1;
    const createdAt = new Date(sixMonthsAgo.getTime() + seededRandom(seed * 7) * timeRange);
    const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    
    cases.push({
      user_id: 38100000 + (i * 1000) + Math.floor(seededRandom(seed) * 999),
      created_at: createdAt.toISOString(),
      analyst: analysts[Math.floor(seededRandom(seed * 2) * analysts.length)],
      days_since_creation: daysSinceCreation,
      status: statuses[Math.floor(seededRandom(seed * 3) * statuses.length)],
      high_value: seededRandom(seed * 4) > 0.7 ? 'yes' : 'no',
      resolution_status: 'pending'
    });
  }

  return cases.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export const mockCases: AMLCase[] = generateMockCases(47);

export function getCaseStats() {
  const total = mockCases.length;
  const pending = mockCases.filter(c => c.resolution_status === 'pending').length;
  const in_review = mockCases.filter(c => c.resolution_status === 'in_review').length;
  const resolved = mockCases.filter(c => 
    c.resolution_status === 'resolved_suspicious' || 
    c.resolution_status === 'resolved_clean'
  ).length;
  const high_value_count = mockCases.filter(c => c.high_value === 'yes').length;
  const avg_days_pending = Math.round(
    mockCases.reduce((acc, c) => acc + c.days_since_creation, 0) / total
  );

  return {
    total,
    pending,
    in_review,
    resolved,
    high_value_count,
    avg_days_pending
  };
}

export function getUniqueAnalysts(): string[] {
  return [...new Set(mockCases.map(c => c.analyst))].sort();
}
