import Link from "next/link";

export default function Home() {
  return (
    <div className="bg-blueprint-grid min-h-screen">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-16 sm:pb-24">

        {/* Hero Section */}
        <section className="pt-14 pb-16 sm:py-24 md:py-32 fade-up relative flex flex-col items-center">
          <div className="flex justify-center mb-6">
            <span className="badge border border-[var(--border)] bg-[var(--background)] px-4 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[var(--muted)]">
              100% Free Practice Platform
            </span>
          </div>

          <div className="mb-10 sm:mb-12 flex justify-center w-full">
            <Link
              href="/app"
              className="group relative inline-flex items-center justify-center rounded-[1.25rem] bg-[var(--accent)] px-10 py-5 sm:px-12 sm:py-6 text-lg sm:text-xl font-bold uppercase tracking-widest text-[#0e0e0e] transition-all hover:bg-[#b0f53b] hover:scale-[1.02] shadow-[0_0_40px_rgba(163,230,53,0.4)]"
            >
              Start practicing, it's all free
            </Link>
          </div>

          <h1 className="heading text-center text-5xl sm:text-7xl md:text-8xl lg:text-[10rem] leading-[0.88] tracking-tight text-[var(--foreground)] mt-2">
            MASTER UPSC WITH<br />
            <span className="text-[var(--accent)] drop-shadow-[0_0_15px_rgba(163,230,53,0.3)]">
              REAL ANALYTICS
            </span>
          </h1>

          <p className="mt-6 sm:mt-8 text-center text-base sm:text-lg md:text-xl leading-7 sm:leading-8 text-[var(--muted)] max-w-xl mx-auto font-medium px-2">
            The smartest way to practice PYQs. Fast, focused sessions against real exam patterns.
          </p>

          {/* Device Mockup */}
          <div className="mt-20 sm:mt-32 relative mx-auto w-full max-w-xs sm:max-w-sm flex justify-center fade-up" style={{ animationDelay: "200ms" }}>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-[var(--accent)]/10 blur-[100px] rounded-full pointer-events-none" />

            <div className="relative w-full rounded-[3rem] border-[8px] border-[#2A2A2A] bg-[#111] shadow-2xl p-2 z-10 mx-auto transform hover:-translate-y-2 transition-transform duration-500">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[24px] bg-[#2A2A2A] rounded-b-3xl z-20" />

              <div className="rounded-[2.5rem] bg-[var(--background)] overflow-hidden h-[480px] sm:h-[600px] relative border border-[#333]">
                <div className="p-5 pt-10 flex justify-between items-center bg-gradient-to-b from-[#1a1a1a] to-transparent">
                  <div className="flex gap-2 items-center">
                    <div className="w-8 h-8 rounded-full bg-[var(--border-light)]" />
                    <div>
                      <div className="text-xs text-[var(--muted)]">You</div>
                      <div className="text-sm font-bold">UPSC Aspirant</div>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-[var(--border-light)]" />
                </div>

                <div className="p-5 mt-2">
                  <div className="flex justify-center mb-4">
                    <span className="text-[var(--accent)] text-xs font-bold tracking-widest uppercase">Target Goal</span>
                  </div>
                  <div className="text-center font-display text-7xl sm:text-8xl text-white mb-6">115</div>

                  <div className="space-y-3">
                    {["A", "B", "C"].map((opt, i) => (
                      <div
                        key={opt}
                        className={`h-14 w-full rounded-2xl border-2 flex items-center px-4 gap-4 ${
                          i === 1
                            ? "border-[var(--accent)] bg-[var(--accent)]/5 relative overflow-hidden"
                            : "border-[var(--border-light)]"
                        }`}
                      >
                        {i === 1 && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--accent)]" />}
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${i === 1 ? "bg-[var(--accent)] text-black" : "bg-[#2a2a2a]"}`}>{opt}</div>
                        <div className="h-2 flex-1 bg-[#2a2a2a] rounded-full" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-[#A78BFA]/20 blur-3xl rounded-full" />
              </div>
            </div>
          </div>
        </section>

        {/* Feature Sections */}
        <section className="py-12 sm:py-24 md:py-32 space-y-16 sm:space-y-32">

          {/* Feature 1 */}
          <div className="grid md:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div className="order-2 md:order-1 relative">
              <div className="absolute inset-0 bg-[#A78BFA]/5 blur-3xl rounded-full translate-x-10" />
              <div className="card-elevated p-6 sm:p-8 relative z-10 border-[#333] border-2">
                <div className="flex justify-between items-start mb-8 sm:mb-12">
                  <span className="text-[var(--accent)] font-display text-4xl">01</span>
                  <div className="w-12 h-12 rounded-full border border-[#333] flex items-center justify-center text-xl">⏱️</div>
                </div>
                <h3 className="heading text-3xl sm:text-4xl mb-3">Exam Mode</h3>
                <p className="text-[var(--muted)] text-base sm:text-lg">Timed tests with question palette, mark for review, option eliminator, and negative marking.</p>
              </div>
            </div>
            <div className="order-1 md:order-2 md:pl-12">
              <h2 className="heading text-4xl sm:text-5xl md:text-6xl mb-4 sm:mb-6 leading-none">PRESSURE <br /><span className="text-[var(--muted)]">TESTED</span></h2>
              <p className="text-lg sm:text-xl text-[var(--muted)]">Build stamina and perfect your time management under real exam conditions.</p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="grid md:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div className="md:pr-12">
              <h2 className="heading text-4xl sm:text-5xl md:text-6xl mb-4 sm:mb-6 leading-none">SMART <br /><span className="text-[var(--accent)]">ANALYTICS</span></h2>
              <p className="text-lg sm:text-xl text-[var(--muted)]">Subject radar, pacing scatter, readiness band, and weakness heatmap to guide your study.</p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-[var(--accent)]/5 blur-3xl rounded-full -translate-x-10" />
              <div className="card-elevated p-6 sm:p-8 relative z-10 border-[var(--accent)]/30 border-2">
                <div className="flex justify-between items-start mb-8 sm:mb-12">
                  <span className="text-[var(--accent)] font-display text-4xl">02</span>
                  <div className="w-12 h-12 rounded-full border border-[#333] bg-[var(--background)] flex items-center justify-center text-xl">📊</div>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-5 sm:mb-6">
                  <div className="panel p-3 sm:p-4 text-center border border-[#333]">
                    <div className="text-3xl sm:text-4xl font-display text-[var(--foreground)]">114</div>
                    <div className="text-xs uppercase tracking-wider text-[var(--muted)] mt-1">Score</div>
                  </div>
                  <div className="panel p-3 sm:p-4 text-center border border-[var(--accent)]/50 bg-[var(--accent)]/10">
                    <div className="text-3xl sm:text-4xl font-display text-[var(--accent)]">68%</div>
                    <div className="text-xs uppercase tracking-wider text-[var(--accent)] mt-1">Accuracy</div>
                  </div>
                </div>
                <h3 className="heading text-3xl sm:text-4xl mb-2">Review Mode</h3>
                <p className="text-[var(--muted)] text-base sm:text-lg">Identify exact weaknesses and save takeaways.</p>
              </div>
            </div>
          </div>

        </section>

        {/* CTA */}
        <section className="mt-4 sm:mt-20 py-16 sm:py-24 text-center relative z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--accent)]/5 -z-10 rounded-[3rem]" />
          <h2 className="heading text-4xl sm:text-6xl md:text-8xl text-white mb-4 sm:mb-6">READY TO PRACTICE?</h2>
          <p className="text-base sm:text-xl text-gray-400 max-w-2xl mx-auto mb-8 sm:mb-12 px-2">
            Join other aspirants practicing PYQs, full-length tests, and subject-wise drills with actionable insights. 100% free forever.
          </p>
          <div className="flex justify-center">
            <Link
              href="/app"
              className="group relative rounded-[1rem] bg-[#000] w-full max-w-xs sm:w-auto px-8 sm:px-12 py-5 sm:py-6 text-lg sm:text-xl font-bold uppercase tracking-wider text-[var(--foreground)] transition-all hover:bg-[var(--background-secondary)] text-center"
            >
              <div className="absolute inset-0 rounded-[1rem] border-2 border-[var(--accent)] shadow-[0_0_20px_rgba(163,230,53,0.2)] group-hover:shadow-[0_0_40px_rgba(163,230,53,0.4)] transition-shadow" />
              START PRACTICING
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}
