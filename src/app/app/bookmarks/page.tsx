export default function BookmarksPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="heading text-4xl mb-2">Bookmarks</h1>
        <p className="text-[var(--muted)]">Your saved important questions for quick revision.</p>
      </div>
      <div className="card-elevated p-8 text-center border border-[#262626]">
        <div className="text-4xl mb-4">🔖</div>
        <h2 className="heading text-2xl mb-2">No Bookmarks Yet</h2>
        <p className="text-[var(--muted)] text-sm">
          While reviewing tests, bookmark questions you find important to revisit them here.
        </p>
      </div>
    </div>
  );
}
