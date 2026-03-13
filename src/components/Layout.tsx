import DashboardHeader from "@/components/soc/DashboardHeader";
import { Outlet } from "react-router-dom";

const Layout = () => (
  <div className="min-h-screen bg-background">
    <DashboardHeader />
    <main className="p-6">
      <Outlet />
    </main>
  </div>
);

export default Layout;
