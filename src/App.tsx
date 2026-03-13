import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/Layout";
import Index from "@/pages/Index";
import ThreatMonitoring from "@/pages/ThreatMonitoring";
import IncidentDetection from "@/pages/IncidentDetection";
import BlockedIPMonitoring from "@/pages/BlockedIPMonitoring";
import SuricataPage from "@/pages/SuricataPage";
import WazuhPage from "@/pages/WazuhPage";
import MitrePage from "@/pages/MitrePage";
import TimelinePage from "@/pages/TimelinePage";
import ThreatIntelligence from "@/pages/ThreatIntelligence";
import AutomatedResponse from "@/pages/AutomatedResponse";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
