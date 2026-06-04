import { useEffect, useState } from "react";
import { Users, Store, Package } from "lucide-react";
import { getAdminStats } from "../../api/admin";
import type { AdminStats } from "../../types";

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

export default function AdminOverview() {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    getAdminStats().then(setStats).catch(console.error);
  }, []);

  if (!stats) {
    return <div className="text-gray-500 text-sm">Duke ngarkuar statistikat...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Paneli</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Gjithsej Përdorues" value={stats.users} icon={Users} color="bg-blue-500" />
        <StatCard label="Shitës" value={stats.sellers} icon={Store} color="bg-emerald-500" />
        <StatCard label="Pjesë të Listuara" value={stats.parts} icon={Package} color="bg-orange-500" />
      </div>
    </div>
  );
}
