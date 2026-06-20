import { useQuery } from '@tanstack/react-query';
import { api } from '../api/routes';

export function useMonthlySummary(month) {
  return useQuery({
    queryKey: ['summary', 'monthly', month],
    queryFn: () => api.getMonthlySummary(month),
    enabled: !!month,
  });
}

export function useDailySummary(month) {
  return useQuery({
    queryKey: ['summary', 'daily', month],
    queryFn: () => api.getDailySummary(month),
    enabled: !!month,
  });
}
