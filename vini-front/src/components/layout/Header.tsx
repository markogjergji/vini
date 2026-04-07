import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  LogOut, LayoutDashboard, UserCircle,
  Menu, X, CarFront, Upload, List,
} from "lucide-react";
import { useAuthStore } from "../../stores/authStore";

interface Props {
  onOpenAuth: (mode: "login" | "register") => void;
}

export default function Header({ onOpenAuth }: Props) {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Lock body scroll while drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  function logout() {
    clearAuth();
    navigate("/");
  }

  return (
    <>
      <header className="bg-zinc-950 border-b border-zinc-800 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">

          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 no-underline group"
            aria-label="Home"
          >
            <CarFront
              size={24}
              className="text-red-500 group-hover:text-red-400 transition-colors"
            /> <p className="text-white">Vini</p>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {user ? (
              <>
                {user.role === "admin" && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-1.5 text-zinc-400 hover:text-white px-3 py-1.5 text-sm no-underline transition-colors rounded hover:bg-zinc-800"
                  >
                    <LayoutDashboard size={14} />
                    Admin
                  </Link>
                )}
                {(user.role === "seller" || user.role === "admin") && (
                  <>
                    <Link
                      to="/my-parts"
                      className="flex items-center gap-1.5 text-zinc-400 hover:text-white px-3 py-1.5 text-sm no-underline transition-colors rounded hover:bg-zinc-800"
                    >
                      <List size={14} />
                      My Listings
                    </Link>
                    <Link
                      to="/upload"
                      className="flex items-center gap-1.5 bg-red-600 text-white px-4 py-1.5 text-sm font-semibold hover:bg-red-500 transition-colors no-underline rounded ml-1"
                    >
                      <Upload size={14} />
                      Shto Pjesë
                    </Link>
                  </>
                )}
                <Link
                  to="/profile"
                  className="flex items-center text-zinc-400 hover:text-white px-2 py-1.5 transition-colors rounded hover:bg-zinc-800 ml-1 no-underline"
                  aria-label="Profile"
                >
                  <UserCircle size={18} />
                </Link>
                <button
                  onClick={logout}
                  className="flex items-center text-zinc-400 hover:text-red-400 px-2 py-1.5 transition-colors rounded hover:bg-zinc-800"
                  aria-label="Sign out"
                >
                  <LogOut size={16} />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onOpenAuth("login")}
                  className="text-zinc-400 hover:text-white px-3 py-1.5 text-sm transition-colors rounded hover:bg-zinc-800"
                >
                  Sign in
                </button>
                <button
                  onClick={() => onOpenAuth("register")}
                  className="bg-red-600 text-white px-4 py-1.5 text-sm font-semibold hover:bg-red-500 transition-colors rounded ml-1"
                >
                  Register
                </button>
              </>
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
        {/* Drawer header */}
        <div className="h-14 flex items-center justify-between px-5 border-b border-zinc-800 shrink-0">
          <CarFront size={22} className="text-red-500" /> <p className="text-white">Vini</p>
          <button
            onClick={() => setMobileOpen(false)}
            className="flex items-center justify-center w-8 h-8 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer links */}
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
              {(user.role === "seller" || user.role === "admin") && (
                <>
                  <Link
                    to="/my-parts"
                    className="flex items-center gap-3 text-zinc-300 hover:text-white hover:bg-zinc-800 px-4 py-3 rounded-lg transition-colors no-underline text-sm"
                  >
                    <List size={16} className="shrink-0" />
                    My Listings
                  </Link>
                  <Link
                    to="/upload"
                    className="flex items-center gap-3 text-zinc-300 hover:text-white hover:bg-zinc-800 px-4 py-3 rounded-lg transition-colors no-underline text-sm"
                  >
                    <Upload size={16} className="shrink-0" />
                    Shto Pjesë
                  </Link>
                </>
              )}
              <Link
                to="/profile"
                className="flex items-center gap-3 text-zinc-300 hover:text-white hover:bg-zinc-800 px-4 py-3 rounded-lg transition-colors no-underline text-sm"
              >
                <UserCircle size={16} className="shrink-0" />
                Profile
              </Link>

              {/* Spacer pushes sign-out to bottom */}
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
                className="w-full bg-red-600 text-white px-4 py-3 text-sm font-semibold hover:bg-red-500 transition-colors rounded-lg"
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
