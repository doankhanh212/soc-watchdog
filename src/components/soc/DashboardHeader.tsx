import { Shield, Activity, Clock } from "lucide-react";
import { useEffect, useState } from "react";

const DashboardHeader = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-3 bg-card">
      <div className="flex items-center gap-3">
        <Shield className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-lg font-bold tracking-wide text-primary font-mono uppercase">
            SOC Dashboard
          </h1>
          <p className="text-xs text-muted-foreground">Security Operations Center — Threat Monitoring</p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="pulse-live absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success" />
          </span>
          <span className="text-xs font-mono text-success">LIVE</span>
        </div>

        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-accent" />
          <span className="text-xs font-mono text-muted-foreground">Wazuh Indexer Connected</span>
        </div>

        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-mono text-muted-foreground">
            {time.toLocaleTimeString("en-US", { hour12: false })} UTC
          </span>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
