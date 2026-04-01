import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="border-b border-gray-300 bg-white">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-base font-bold text-gray-900 no-underline">
          VINI AUTO PARTS
        </Link>
        <Link
          to="/upload"
          className="bg-blue-600 text-white px-3 py-1.5 text-sm hover:bg-blue-700 no-underline"
        >
          Sell a Part
        </Link>
      </div>
    </header>
  );
}
