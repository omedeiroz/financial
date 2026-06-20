import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/routes';

export function useRoutesByDate(date) {
  return useQuery({
    queryKey: ['routes', 'date', date],
    queryFn: () => api.getByDate(date),
    enabled: !!date,
  });
}

export function useRoute(id) {
  return useQuery({
    queryKey: ['routes', id],
    queryFn: () => api.getOne(id),
    enabled: !!id,
  });
}

export function useCreateRoute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routes'] }),
  });
}

export function useUpdateRoute(id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.update(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routes'] }),
  });
}

export function useDeleteRoute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routes'] }),
  });
}
