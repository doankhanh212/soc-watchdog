import { Shield, Activity, Clock, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Bảng điều khiển", path: "/" },
  { label: "Giám sát đe dọa", path: "/threats" },
  { label: "Phát hiện sự cố", path: "/incidents" },
  { label: "IP bị chặn", path: "/blocked-ips" },
  { label: "Suricata", path: "/suricata" },
  { label: "Wazuh", path: "/wazuh" },
  { label: "MITRE ATT&CK", path: "/mitre" },
  { label: "Dòng thời gian", path: "/timeline" },
  { label: "Tình báo", path: "/threat-intel" },
  { label: "Phản ứng", path: "/response" },
  { label: "Bản đồ tấn công", path: "/attack-map" },
];

const DashboardHeader = () => {
  const [time, setTime] = useState(new Date());
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="border-b border-border bg-card">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-lg font-bold tracking-widest text-primary font-mono uppercase">
              HQG Security SOC Platform
            </h1>
            <p className="text-xs text-muted-foreground tracking-wide">
              Trung tâm điều hành an ninh (SOC) – Giám sát mối đe dọa &amp; Phản ứng sự cố
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="pulse-live absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success" />
            </span>
            <span className="text-xs font-mono text-success">TRỰC TIẾP</span>
          </div>

          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-accent" />
            <span className="text-xs font-mono text-muted-foreground">Wazuh Indexer đã kết nối</span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-mono text-muted-foreground">
              {time.toLocaleTimeString("en-US", { hour12: false })} UTC
            </span>
          </div>

          <button
            onClick={() => setNavOpen(!navOpen)}
            className="lg:hidden p-1 text-muted-foreground hover:text-foreground"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      <nav className={cn(
        "flex items-center gap-1 px-6 pb-2 overflow-x-auto",
        navOpen ? "flex" : "hidden lg:flex"
      )}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) =>
              cn(
                "px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded transition-colors whitespace-nowrap",
                isActive
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
};

export default DashboardHeader;
