export const inputClass = "mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 outline-none";

export function Field({ label, required, hint, error, children }) {
  return (
    <label className="mt-5 block text-sm">
      <span>{label}</span>
      {required && <span className="ml-2 text-xs text-red-600">必須</span>}
      {children}
      {hint && <span className="mt-1 block text-xs text-stone-400">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

export function PrimaryButton({ children, type = "submit" }) {
  return <button type={type} className="rounded-md bg-[#1f6b4a] px-4 py-2 text-sm text-white">{children}</button>;
}

export function GhostButton({ children, onClick, type = "button" }) {
  return <button type={type} className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm" onClick={onClick}>{children}</button>;
}

export function Card({ children, className = "" }) {
  return <section className={"rounded-xl border border-stone-200 bg-white " + className}>{children}</section>;
}
