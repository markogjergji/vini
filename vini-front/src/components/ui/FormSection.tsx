import type { ReactNode } from "react";

interface Props {
  title: string;
  children: ReactNode;
}

export default function FormSection({ title, children }: Props) {
  return (
    <section className="border border-gray-200 bg-white">
      <div className="px-5 py-3 border-b border-gray-100">
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-700">{title}</h2>
      </div>
      <div className="px-5 py-4 space-y-4">{children}</div>
    </section>
  );
}
