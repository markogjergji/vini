interface Props {
  label: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}

export default function Toggle({ label, checked, onChange }: Props) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <span className="text-xs font-medium text-gray-600 whitespace-nowrap">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={[
          "relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
          checked ? "bg-blue-500" : "bg-gray-200",
        ].join(" ")}
      >
        <span
          className={[
            "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200",
            checked ? "translate-x-4" : "translate-x-0",
          ].join(" ")}
        />
      </button>
    </label>
  );
}
