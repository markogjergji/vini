import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  LogOut, LayoutDashboard, UserCircle,
  Menu, X, Upload, List, ShieldAlert,
} from "lucide-react";
import { useAuthStore } from "../../stores/authStore";

interface Props {
  onOpenAuth: (mode: "login" | "register") => void;
}

export default function Header({ onOpenAuth }: Props) {
  const { user, adminUser, clearAuth, stopImpersonation } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const isImpersonating = !!adminUser;
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  function logout() {
    clearAuth();
    navigate("/");
  }

  function handleStopImpersonation() {
    stopImpersonation();
    navigate("/admin/users");
  }

  return (
    <>
      {isImpersonating && (
        <div className="bg-amber-400 text-amber-950 text-sm font-medium px-4 py-2 flex items-center justify-center gap-3 sticky top-0 z-50">
          <ShieldAlert size={15} className="shrink-0" />
          <span>Duke u kyçur si <strong>{user?.username}</strong></span>
          <button
            onClick={handleStopImpersonation}
            className="ml-2 underline hover:no-underline font-semibold"
          >
            Kthehu te Admin
          </button>
        </div>
      )}
      <header className="bg-zinc-950 border-b border-zinc-800 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

          {/* Logo — far left */}
          <Link to="/" className="flex items-center no-underline shrink-0" aria-label="Home">
            <img src="/logo.svg" alt="Vini" className="h-12 w-auto brightness-0 invert" />
          </Link>

          {/* Desktop nav — far right */}
          <nav className="hidden md:flex items-center gap-1">
            {user ? (
              <>
                {/* Nav links */}
                <div className="flex items-center gap-1 mr-2">
                  {user.role === "admin" && (
                    <Link
                      to="/admin"
                      className="flex items-center gap-2 text-zinc-400 hover:text-white hover:bg-zinc-800 px-4 py-2 text-sm rounded-md transition-colors no-underline"
                    >
                      <LayoutDashboard size={14} />
                      Admin
                    </Link>
                  )}
                  {user.role === "seller" && (
                    <Link
                      to="/my-parts"
                      className="flex items-center gap-2 text-zinc-400 hover:text-white hover:bg-zinc-800 px-4 py-2 text-sm rounded-md transition-colors no-underline"
                    >
                      <List size={14} />
                      My Listings
                    </Link>
                  )}
                  {user.role === "seller" && (
                    <Link
                      to="/upload"
                      className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-4 py-2 text-sm font-semibold rounded-md transition-colors no-underline"
                    >
                      <Upload size={14} />
                      Shto Pjesë
                    </Link>
                  )}
                </div>

                {/* Separator */}
                <div className="w-px h-5 bg-zinc-700" />

                {/* Account icons — far right */}
                <div className="flex items-center gap-1 ml-2">
                  <Link
                    to="/profile"
                    className="flex items-center justify-center w-9 h-9 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors no-underline"
                    aria-label="Profile"
                  >
                    <UserCircle size={19} />
                  </Link>
                  <button
                    onClick={logout}
                    className="flex items-center justify-center w-9 h-9 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-md transition-colors"
                    aria-label="Sign out"
                  >
                    <LogOut size={17} />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth("login")}
                  className="text-zinc-400 hover:text-white hover:bg-zinc-800 px-4 py-2 text-sm rounded-md transition-colors"
                >
                  Sign in
                </button>
                <button
                  onClick={() => onOpenAuth("register")}
                  className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 text-sm font-semibold rounded-md transition-colors"
                >
                  Register
                </button>
              </div>
            )}
          </nav>

          {/* Mobile hamburger */}
          <button
            className="md:hidden flex items-center justify-center w-9 h-9 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
        </div>
      </header>

      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 z-50 md:hidden bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Mobile drawer */}
      <aside
        className={`fixed top-0 right-0 h-full w-72 z-50 md:hidden bg-zinc-950 border-l border-zinc-800 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-16 flex items-center justify-between px-5 border-b border-zinc-800 shrink-0">
          <img src="/logo.svg" alt="Vini" className="h-8 w-auto brightness-0 invert" />
          <button
            onClick={() => setMobileOpen(false)}
            className="flex items-center justify-center w-8 h-8 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex flex-col flex-1 px-3 py-4 overflow-y-auto">
          {user ? (
            <>
              {user.role === "admin" && (
                <Link
                  to="/admin"
                  className="flex items-center gap-3 text-zinc-300 hover:text-white hover:bg-zinc-800 px-4 py-3 rounded-lg transition-colors no-underline text-sm"
                >
                  <LayoutDashboard size={16} className="shrink-0" />
                  Admin Dashboard
                </Link>
              )}
              {user.role === "seller" && (
                <Link
                  to="/my-parts"
                  className="flex items-center gap-3 text-zinc-300 hover:text-white hover:bg-zinc-800 px-4 py-3 rounded-lg transition-colors no-underline text-sm"
                >
                  <List size={16} className="shrink-0" />
                  My Listings
                </Link>
              )}
              {user.role === "seller" && (
                <Link
                  to="/upload"
                  className="flex items-center gap-3 text-zinc-300 hover:text-white hover:bg-zinc-800 px-4 py-3 rounded-lg transition-colors no-underline text-sm"
                >
                  <Upload size={16} className="shrink-0" />
                  Shto Pjesë
                </Link>
              )}
              <Link
                to="/profile"
                className="flex items-center gap-3 text-zinc-300 hover:text-white hover:bg-zinc-800 px-4 py-3 rounded-lg transition-colors no-underline text-sm"
              >
                <UserCircle size={16} className="shrink-0" />
                Profile
              </Link>

              <div className="flex-1" />

              <div className="border-t border-zinc-800 pt-3 mt-3">
                <button
                  onClick={logout}
                  className="flex items-center gap-3 text-zinc-400 hover:text-red-400 hover:bg-zinc-800/60 px-4 py-3 rounded-lg transition-colors text-sm w-full"
                >
                  <LogOut size={16} className="shrink-0" />
                  Sign out
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-2">
              <button
                onClick={() => { onOpenAuth("login"); setMobileOpen(false); }}
                className="w-full text-left flex items-center gap-3 text-zinc-300 hover:text-white hover:bg-zinc-800 px-4 py-3 rounded-lg transition-colors text-sm"
              >
                Sign in
              </button>
              <button
                onClick={() => { onOpenAuth("register"); setMobileOpen(false); }}
                className="w-full bg-red-600 hover:bg-red-500 text-white px-4 py-3 text-sm font-semibold rounded-lg transition-colors"
              >
                Register
              </button>
            </div>
          )}
        </nav>
      </aside>
    </>
  );
}
