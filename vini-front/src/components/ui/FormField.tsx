import type { ReactNode } from "react";

const labelCls = "block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1";

interface Props {
  label: string;
  required?: boolean;
  optional?: boolean;
  hint?: string;
  children: ReactNode;
  className?: string;
}

export default function FormField({ label, required, optional, hint, children, className }: Props) {
  return (
    <div className={className}>
      <label className={labelCls}>
        {label}
        {required && " *"}
        {optional && <span className="normal-case font-normal text-gray-400"> (opsionale)</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}
