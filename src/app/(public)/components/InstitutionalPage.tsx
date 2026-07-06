export default function InstitutionalPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-extrabold text-ink">{title}</h1>
      <div className="prose-news mt-6">{children}</div>
    </div>
  );
}
