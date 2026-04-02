const CATEGORIES = [
  { label: "Clearance",        gradient: "from-zinc-800 to-zinc-900" },
  { label: "Air Intakes",      gradient: "from-zinc-800 to-zinc-900" },
  { label: "Brakes",           gradient: "from-zinc-800 to-zinc-900" },
  { label: "Aero & Body Kits", gradient: "from-zinc-800 to-zinc-900" },
  { label: "ECU Tuning",       gradient: "from-zinc-800 to-zinc-900" },
  { label: "Engine Parts",     gradient: "from-zinc-800 to-zinc-900" },
  { label: "Exhaust",          gradient: "from-zinc-800 to-zinc-900" },
  { label: "Exterior",         gradient: "from-zinc-800 to-zinc-900" },
  { label: "Fuel Components",  gradient: "from-zinc-800 to-zinc-900" },
  { label: "Gauges",           gradient: "from-zinc-800 to-zinc-900" },
  { label: "Interior",         gradient: "from-zinc-800 to-zinc-900" },
  { label: "Lighting",         gradient: "from-zinc-800 to-zinc-900" },
];

export default function CategoryGrid() {
  return (
    <section className="py-12 px-4 bg-white">
      <h2 className="text-center text-xl font-semibold text-gray-800 mb-8 tracking-tight">
        Shop Aftermarket Parts &amp; Accessories by Category
      </h2>
      <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.label}
            className={`bg-gradient-to-br ${cat.gradient} aspect-square flex items-end p-3 hover:scale-[1.03] hover:shadow-lg transition-all duration-200 cursor-pointer group`}
          >
            <span className="text-white text-xs font-bold uppercase leading-tight drop-shadow-md group-hover:text-yellow-300 transition-colors">
              {cat.label}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
