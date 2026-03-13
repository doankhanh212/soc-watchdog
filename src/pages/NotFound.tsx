import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Shield } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 – Người dùng truy cập tuyến đường không tồn tại:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <Shield className="h-12 w-12 text-primary mx-auto mb-4 opacity-50" />
        <h1 className="mb-2 text-4xl font-bold font-mono text-primary">404</h1>
        <p className="mb-1 text-sm text-muted-foreground font-mono uppercase tracking-widest">Truy cập bị từ chối</p>
        <p className="mb-4 text-xs text-muted-foreground font-mono">Tuyến đường không tồn tại trên hệ thống SOC</p>
        <a href="/" className="text-xs font-mono text-accent underline hover:text-accent/80">
          Quay lại bảng điều khiển SOC
        </a>
      </div>
    </div>
  );
};

export default NotFound;
