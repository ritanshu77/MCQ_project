 "use client";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { usePathname } from "next/navigation";

// metadata removed to allow client layout

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: any;  // User type add karo
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideChrome = /^\/dashboard\/units\/[^/]+\/sets\/[^/]+$/.test(pathname || "");
  if (hideChrome) {
    return (
      <main className="main-content" style={{ minHeight: "100vh" }}>
        {children}
      </main>
    );
  }
  return (
    <div>
      <Navbar />
      <div className="wrapper">
        <Sidebar />
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}
