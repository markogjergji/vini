import FormField from "./FormField";

const inputCls =
  "border border-gray-200 bg-white px-3 py-2 text-sm w-full focus:outline-none focus:border-gray-400 transition-colors";

interface Props {
  label: string;
  required?: boolean;
  optional?: boolean;
  hint?: string;
  type?: string;
  value: string | number;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
}

export default function TextInput({
  label,
  required,
  optional,
  hint,
  type = "text",
  value,
  onChange,
  className,
  placeholder,
  autoFocus,
}: Props) {
  return (
    <FormField label={label} required={required} optional={optional} hint={hint} className={className}>
      <input
        type={type}
        className={inputCls}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
      />
    </FormField>
  );
}
