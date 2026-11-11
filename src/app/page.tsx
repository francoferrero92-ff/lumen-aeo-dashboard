import { Dashboard } from "@/components/dashboard/Dashboard";
import { Sidebar } from "@/components/dashboard/Sidebar";

export default function Page() {
  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <Dashboard />
    </div>
  );
}
