import { Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/Layout";

const Index = lazy(() => import("@/pages/Index"));
const ThreatMonitoring = lazy(() => import("@/pages/ThreatMonitoring"));
const IncidentDetection = lazy(() => import("@/pages/IncidentDetection"));
const BlockedIPMonitoring = lazy(() => import("@/pages/BlockedIPMonitoring"));
const SuricataPage = lazy(() => import("@/pages/SuricataPage"));
const WazuhPage = lazy(() => import("@/pages/WazuhPage"));
const MitrePage = lazy(() => import("@/pages/MitrePage"));
const TimelinePage = lazy(() => import("@/pages/TimelinePage"));
const ThreatIntelligence = lazy(() => import("@/pages/ThreatIntelligence"));
const AutomatedResponse = lazy(() => import("@/pages/AutomatedResponse"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div className="p-6">
    <div className="soc-card">
      <p className="text-xs font-mono text-muted-foreground animate-pulse">Đang tải trang…</p>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Index />} />
              <Route path="/threats" element={<ThreatMonitoring />} />
              <Route path="/incidents" element={<IncidentDetection />} />
              <Route path="/blocked-ips" element={<BlockedIPMonitoring />} />
              <Route path="/suricata" element={<SuricataPage />} />
              <Route path="/wazuh" element={<WazuhPage />} />
              <Route path="/mitre" element={<MitrePage />} />
              <Route path="/timeline" element={<TimelinePage />} />
              <Route path="/threat-intel" element={<ThreatIntelligence />} />
              <Route path="/response" element={<AutomatedResponse />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
