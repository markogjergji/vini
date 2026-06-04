import { useEffect, useState } from "react";
import { Users, Store, Package } from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
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

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">{title}</h2>
      {children}
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  active: "#22c55e",
  sold: "#3b82f6",
  reserved: "#f59e0b",
  expired: "#ef4444",
};

const CONDITION_COLORS: Record<string, string> = {
  used: "#f97316",
  refurbished: "#8b5cf6",
  new_old_stock: "#06b6d4",
};

const ROLE_COLORS: Record<string, string> = {
  user: "#3b82f6",
  seller: "#22c55e",
  admin: "#ef4444",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Aktiv",
  sold: "Shitur",
  reserved: "Rezervuar",
  expired: "Skaduar",
};

const CONDITION_LABELS: Record<string, string> = {
  used: "I përdorur",
  refurbished: "I rinovuar",
  new_old_stock: "NOS",
};

const ROLE_LABELS: Record<string, string> = {
  user: "Përdorues",
  seller: "Shitës",
  admin: "Admin",
};

const SELLER_COLORS = ["#22c55e", "#d1d5db"];
const SELLER_TYPE_COLORS = ["#3b82f6", "#a78bfa"];

function DonutChart({ data, colors, labels }: {
  data: Record<string, number>;
  colors: Record<string, string>;
  labels: Record<string, string>;
}) {
  const entries = Object.entries(data).filter(([, v]) => v > 0);
  const chartData = entries.map(([key, value]) => ({ name: labels[key] ?? key, value, key }));

  return (
    <div className="flex items-center gap-6">
      <ResponsiveContainer width={140} height={140}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={38}
            outerRadius={60}
            dataKey="value"
            strokeWidth={0}
          >
            {chartData.map((entry) => (
              <Cell key={entry.key} fill={colors[entry.key] ?? "#94a3b8"} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [Number(value).toLocaleString(), name]}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
          />
        </PieChart>
      </ResponsiveContainer>
      <ul className="flex flex-col gap-2 text-sm">
        {chartData.map((entry) => (
          <li key={entry.key} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: colors[entry.key] ?? "#94a3b8" }} />
            <span className="text-gray-600">{entry.name}</span>
            <span className="ml-auto font-semibold text-gray-900">{entry.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SimpleDonut({ slices, colors, labels }: {
  slices: { key: string; value: number }[];
  colors: string[];
  labels: string[];
}) {
  const chartData = slices.filter((s) => s.value > 0).map((s, i) => ({
    name: labels[i],
    value: s.value,
    color: colors[i],
  }));

  return (
    <div className="flex items-center gap-6">
      <ResponsiveContainer width={140} height={140}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={38}
            outerRadius={60}
            dataKey="value"
            strokeWidth={0}
          >
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [Number(value).toLocaleString(), name]}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
          />
        </PieChart>
      </ResponsiveContainer>
      <ul className="flex flex-col gap-2 text-sm">
        {chartData.map((entry, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
            <span className="text-gray-600">{entry.name}</span>
            <span className="ml-auto font-semibold text-gray-900">{entry.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ConditionBar({ data }: { data: Record<string, number> }) {
  const chartData = Object.entries(data)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({ name: CONDITION_LABELS[key] ?? key, value, key }));

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          formatter={(value, _, props) => [Number(value), (props as any).payload?.name]}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
        />
        <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={60}>
          {chartData.map((entry) => (
            <Cell key={entry.key} fill={CONDITION_COLORS[entry.key] ?? "#94a3b8"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Paneli</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Gjithsej Përdorues" value={stats.users} icon={Users} color="bg-blue-500" />
        <StatCard label="Shitës" value={stats.sellers} icon={Store} color="bg-emerald-500" />
        <StatCard label="Pjesë të Listuara" value={stats.parts} icon={Package} color="bg-orange-500" />
      </div>

      {stats.parts_by_status && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ChartCard title="Pjesët sipas statusit">
            <DonutChart
              data={stats.parts_by_status}
              colors={STATUS_COLORS}
              labels={STATUS_LABELS}
            />
          </ChartCard>

          <ChartCard title="Pjesët sipas gjendjes">
            <ConditionBar data={stats.parts_by_condition ?? {}} />
          </ChartCard>

          <ChartCard title="Përdoruesit sipas rolit">
            <DonutChart
              data={stats.users_by_role ?? {}}
              colors={ROLE_COLORS}
              labels={ROLE_LABELS}
            />
          </ChartCard>

          <ChartCard title="Shitësit">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-2">Verifikimi</p>
                <SimpleDonut
                  slices={[
                    { key: "verified", value: stats.sellers_verified ?? 0 },
                    { key: "unverified", value: stats.sellers_unverified ?? 0 },
                  ]}
                  colors={SELLER_COLORS}
                  labels={["Të verifikuar", "Jo të verifikuar"]}
                />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2">Lloji</p>
                <SimpleDonut
                  slices={[
                    { key: "business", value: stats.sellers_business ?? 0 },
                    { key: "individual", value: stats.sellers_individual ?? 0 },
                  ]}
                  colors={SELLER_TYPE_COLORS}
                  labels={["Biznes", "Individual"]}
                />
              </div>
            </div>
          </ChartCard>
        </div>
      )}
    </div>
  );
}
