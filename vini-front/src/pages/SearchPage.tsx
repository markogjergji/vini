import SearchBar from "../components/search/SearchBar";
import CategoryGrid from "../components/home/CategoryGrid";
import heroBg from "../assets/cars.jpg";

export default function SearchPage() {
  return (
    <div>
      {/* Hero */}
      <div className="relative bg-gray-900 min-h-[280px] flex items-center">
        {/* Clip only the background layers so scaled/blurred image edges don't show */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Blurred background image */}
          <div
            className="absolute inset-0 bg-cover bg-center scale-105 blur-[1px]"
            style={{ backgroundImage: `url(${heroBg})` }}
          />
          {/* Dark overlay for readability */}
          <div className="absolute inset-0 bg-black/70" />
        </div>

        <div className="relative z-10 w-full flex flex-col items-center px-4 py-14 text-center">
          <p className="text-red-400 text-xs font-bold uppercase tracking-[0.2em] mb-3">
            Burimi Më i Madh i Pjesëve të Makinave në Shqipëri
          </p>
          <h1 className="font-heading text-white text-3xl sm:text-4xl mb-2 leading-tight drop-shadow-lg">
            Mirë se vini në Vini Auto Parts
          </h1>
          <p className="text-zinc-400 text-sm mb-10">
            Mijëra Marka &mdash; Mijëra Modele &mdash; Mijëra Pjesë
          </p>
          <SearchBar />
        </div>
      </div>

      {/* Category grid */}
      <CategoryGrid />


    </div>
  );
}
