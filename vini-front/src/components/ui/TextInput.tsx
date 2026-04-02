import FormField from "./FormField";

const inputCls =
  "border border-gray-200 bg-white px-3 py-2 text-sm w-full focus:outline-none focus:border-gray-400 transition-colors";

interface Props {
  label: string;
  required?: boolean;
  optional?: boolean;
  type?: string;
  value: string | number;
  onChange: (value: string) => void;
  className?: string;
}

export default function TextInput({
  label,
  required,
  optional,
  type = "text",
  value,
  onChange,
  className,
}: Props) {
  return (
    <FormField label={label} required={required} optional={optional} className={className}>
      <input
        type={type}
        className={inputCls}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </FormField>
  );
}
