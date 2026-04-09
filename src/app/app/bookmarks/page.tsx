export default function BookmarksPage() {
  return (
    <div className="px-4 py-6 sm:p-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="heading text-2xl mb-1.5 sm:text-4xl sm:mb-2">Bookmarks</h1>
        <p className="text-sm text-[var(--muted)] sm:text-base">Your saved important questions for quick revision.</p>
      </div>
      <div className="card-elevated p-6 text-center border border-[var(--border)] sm:p-8">
        <div className="text-3xl mb-3 sm:text-4xl sm:mb-4">🔖</div>
        <h2 className="heading text-xl mb-1.5 sm:text-2xl sm:mb-2">No Bookmarks Yet</h2>
        <p className="text-[var(--muted)] text-sm">
          While reviewing tests, bookmark questions you find important to revisit them here.
        </p>
      </div>
    </div>
  );
}
