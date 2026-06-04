import SearchBar from "../components/search/SearchBar";
import CategoryGrid from "../components/home/CategoryGrid";
import ShopsMap from "../components/map/ShopsMap";
import heroBg from "../assets/cars.jpg";

export default function SearchPage() {
  return (
    <div>
      {/* Hero */}
      <div className="relative bg-gray-950 min-h-[380px] flex items-center">
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center scale-105"
            style={{ backgroundImage: `url(${heroBg})` }}
          />
          {/* Multi-layer overlay: deep gradient top/bottom + side vignette */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/60 to-black/90" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/50" />
        </div>

        <div className="relative z-10 w-full flex flex-col items-center px-4 py-20 text-center">
          {/* Logo */}
          <img src="/logo.svg" alt="Pjesë Makinash" className="h-20 w-auto mb-7 brightness-0 invert" />

          <h1 className="font-heading text-white text-4xl sm:text-5xl lg:text-[3.5rem] mb-5 leading-[1.15] drop-shadow-xl max-w-2xl">
            Gjej Pjesën e Duhur<br />
            <span className="text-red-500">për Makinën Tënde</span>
          </h1>

          <p className="text-zinc-300 text-sm sm:text-base mb-4 max-w-lg leading-relaxed">
            Katalogu më i madh i pjesëve të këmbimit në Shqipëri —
            nga markat premium deri tek alternativat ekonomike.
          </p>

          {/* Trust stats */}
          <div className="flex items-center gap-5 text-zinc-500 text-xs font-medium mb-11 tracking-wide">
            <span className="text-zinc-400">10,000+ Pjesë</span>
            <span className="text-zinc-700">•</span>
            <span className="text-zinc-400">500+ Marka Automjetesh</span>
            <span className="text-zinc-700">•</span>
            <span className="text-zinc-400">Dërgim Kudo në Shqipëri</span>
          </div>

          <SearchBar />
        </div>
      </div>

      {/* Category grid */}
      <CategoryGrid />

      {/* Shops map */}
      <ShopsMap />
    </div>
  );
}
