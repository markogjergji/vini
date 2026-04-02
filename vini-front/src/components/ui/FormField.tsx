import type { ReactNode } from "react";

const labelCls = "block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1";

interface Props {
  label: string;
  required?: boolean;
  optional?: boolean;
  children: ReactNode;
  className?: string;
}

export default function FormField({ label, required, optional, children, className }: Props) {
  return (
    <div className={className}>
      <label className={labelCls}>
        {label}
        {required && " *"}
        {optional && <span className="normal-case font-normal text-gray-400"> (optional)</span>}
      </label>
      {children}
    </div>
  );
}
