import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import Overview from '@/pages/Overview';
import LiveMonitoring from '@/pages/LiveMonitoring';
import CamerasPage from '@/pages/CamerasPage';
import CameraDetail from '@/pages/CameraDetail';
import IncidentsPage from '@/pages/IncidentsPage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import SystemPage from '@/pages/SystemPage';
import { useWebSocket } from '@/lib/useWebSocket';
import { usePravaahStore } from '@/store/pravaahStore';
import { api } from '@/lib/api';

function AppDataLoader() {
  const { setCameras, setIncidents } = usePravaahStore();

  useEffect(() => {
    // Load initial data — fire and forget, errors silently logged
    api.getCameras()
      .then(setCameras)
      .catch((e: Error) => console.warn('Failed to load cameras:', e.message));

    api.getIncidents()
      .then(setIncidents)
      .catch((e: Error) => console.warn('Failed to load incidents:', e.message));
  }, [setCameras, setIncidents]);

  // Establish WebSocket connection at app root
  useWebSocket();

  return null;
}

export default function App() {
  return (
    <>
      <AppDataLoader />
      <Layout>
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/live" element={<LiveMonitoring />} />
          <Route path="/cameras" element={<CamerasPage />} />
          <Route path="/cameras/:id" element={<CameraDetail />} />
          <Route path="/incidents" element={<IncidentsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/system" element={<SystemPage />} />
        </Routes>
      </Layout>
    </>
  );
}
