import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="bg-zinc-950 border-b border-zinc-800">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="font-heading text-white text-base font-bold tracking-widest uppercase no-underline hover:text-red-500 transition-colors">
          Vini Auto Parts
        </Link>
        <nav className="flex items-center gap-6">
          {/* <Link to="/" className="text-zinc-400 text-sm hover:text-white transition-colors no-underline">
            Kërko
          </Link> */}
          <Link
            to="/upload"
            className="bg-red-600 text-white px-4 py-1.5 text-sm font-semibold hover:bg-red-500 transition-colors no-underline"
          >
            Shit një Pjesë
          </Link>
        </nav>
      </div>
    </header>
  );
}
