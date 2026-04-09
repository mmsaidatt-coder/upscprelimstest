export default function CurrentAffairsAppPage() {
  return (
    <div className="px-4 py-6 sm:p-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="heading text-2xl mb-1.5 sm:text-4xl sm:mb-2">Current Affairs</h1>
        <p className="text-sm text-[var(--muted)] sm:text-base">Stay sharp with current affairs tests and quick quizzes.</p>
      </div>
      <div className="card-elevated p-6 text-center border border-[var(--border)] sm:p-8">
        <div className="text-3xl mb-3 sm:text-4xl sm:mb-4">📰</div>
        <h2 className="heading text-xl mb-1.5 sm:text-2xl sm:mb-2">Coming Soon</h2>
        <p className="text-[var(--muted)] text-sm">
          Current affairs tests and topic-wise quizzes will be available shortly.
        </p>
      </div>
    </div>
  );
}
