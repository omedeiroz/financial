import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DailyView from './pages/DailyView/DailyView';
import MonthHistory from './pages/MonthHistory/MonthHistory';
import RoutesList from './pages/RoutesList/RoutesList';
import RouteForm from './pages/RouteForm/RouteForm';
import RouteDetail from './pages/RouteDetail/RouteDetail';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DailyView />} />
          <Route path="/routes" element={<RoutesList />} />
          <Route path="/routes/new" element={<RouteForm />} />
          <Route path="/routes/:id" element={<RouteDetail />} />
          <Route path="/routes/:id/edit" element={<RouteForm />} />
          <Route path="/history" element={<MonthHistory />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
