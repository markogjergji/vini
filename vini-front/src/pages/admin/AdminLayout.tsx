import { useState } from "react";
import { NavLink, Link, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, Store, Package, LogOut, Car, ArrowLeft, Menu, X, Tag } from "lucide-react";
import { useAuthStore } from "../../stores/authStore";

const NAV = [
  { to: "/admin", label: "Përmbledhje", icon: LayoutDashboard, end: true },
  { to: "/admin/users", label: "Përdoruesit", icon: Users, end: false },
  { to: "/admin/sellers", label: "Shitësit", icon: Store, end: false },
  { to: "/admin/parts", label: "Pjesët", icon: Package, end: false },
  { to: "/admin/categories", label: "Kategoritë", icon: Tag, end: false },
  { to: "/admin/brands", label: "Markat & Modelet", icon: Car, end: false },
];

export default function AdminLayout() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function logout() {
    clearAuth();
    navigate("/");
  }

  function closeSidebar() {
    setSidebarOpen(false);
  }

  const sidebarContent = (
    <>
      <div className="px-5 py-4 border-b border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="block no-underline" onClick={closeSidebar}>
            <img src="/logo.svg" alt="Vini" className="h-10 w-auto brightness-0 invert" />
          </Link>
          <button
            onClick={closeSidebar}
            className="md:hidden p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <p className="text-xs text-zinc-400 truncate">{user?.email}</p>
        <Link
          to="/"
          onClick={closeSidebar}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors no-underline"
        >
          <ArrowLeft size={12} />
          Kthehu në faqe
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={closeSidebar}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-red-600 text-white"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-zinc-800">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm text-zinc-400 hover:bg-zinc-800 hover:text-red-400 transition-colors"
        >
          <LogOut size={16} />
          Dil
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-zinc-100">
      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar — always visible on md+, drawer on mobile */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-56 bg-zinc-950 text-white flex flex-col border-r border-zinc-800
          transform transition-transform duration-200 ease-in-out
          md:static md:translate-x-0 md:z-auto md:flex-shrink-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {sidebarContent}
      </aside>

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-zinc-950 border-b border-zinc-800">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <Menu size={20} />
          </button>
          <img src="/logo.svg" alt="Vini" className="h-7 w-auto brightness-0 invert" />
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
