import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import { useKeepAlive } from './hooks/useKeepAlive';
import DailyView from './pages/DailyView/DailyView';
import MonthHistory from './pages/MonthHistory/MonthHistory';
import RoutesList from './pages/RoutesList/RoutesList';
import RouteForm from './pages/RouteForm/RouteForm';
import RouteDetail from './pages/RouteDetail/RouteDetail';
import Profile from './pages/Profile/Profile';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 2 },
  },
});

function AppRoutes() {
  useKeepAlive();
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ErrorBoundary><DailyView /></ErrorBoundary>} />
        <Route path="/routes" element={<ErrorBoundary><RoutesList /></ErrorBoundary>} />
        <Route path="/routes/new" element={<ErrorBoundary><RouteForm /></ErrorBoundary>} />
        <Route path="/routes/:id" element={<ErrorBoundary><RouteDetail /></ErrorBoundary>} />
        <Route path="/routes/:id/edit" element={<ErrorBoundary><RouteForm /></ErrorBoundary>} />
        <Route path="/history" element={<ErrorBoundary><MonthHistory /></ErrorBoundary>} />
        <Route path="/profile" element={<ErrorBoundary><Profile /></ErrorBoundary>} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppRoutes />
    </QueryClientProvider>
  );
}
