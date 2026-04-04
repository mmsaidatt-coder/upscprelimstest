import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="bg-blueprint-grid min-h-screen flex flex-col font-sans">
      
      <main className="flex-1 w-full flex flex-col items-center">
        
        {/* ── Hero Section ── */}
        <section className="w-full pt-20 pb-16 sm:py-24 md:py-32 px-4 sm:px-6 flex flex-col items-center justify-center fade-up relative">
          <div className="flex justify-center mb-6">
            <span className="badge border border-[var(--border)] bg-[var(--background)] px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[var(--muted)]">
              100% Free Practice Platform
            </span>
          </div>

          <h1 className="heading text-4xl sm:text-6xl md:text-7xl lg:text-[5rem] text-center text-[var(--foreground)] max-w-5xl tracking-tight leading-[1.1] mb-6">
            Practice UPSC Prelims with <br className="hidden sm:block" />
            <span className="text-[var(--accent)] drop-shadow-[0_0_15px_rgba(163,230,53,0.3)]">
              real PYQs
            </span> and detailed analytics
          </h1>
          
          <p className="text-[var(--muted)] text-lg sm:text-xl text-center font-medium mb-12 max-w-2xl px-2">
            15,000+ questions | 12+ years of PYQs | Full-length mock tests
          </p>
          
          <div className="flex flex-col sm:flex-row gap-5">
            <Link
              href="/app/pyq"
              className="group relative inline-flex items-center justify-center rounded-[1.25rem] bg-[var(--accent)] px-8 py-4 sm:px-10 sm:py-5 text-lg font-bold uppercase tracking-widest text-[#0e0e0e] transition-all hover:bg-[#b0f53b] hover:-translate-y-1 shadow-[0_0_30px_rgba(163,230,53,0.3)] hover:shadow-[0_0_40px_rgba(163,230,53,0.5)] text-center"
            >
              Start PYQ practice
            </Link>
            <Link
              href="/app/flt"
              className="group relative inline-flex items-center justify-center rounded-[1.25rem] bg-[#111] border-2 border-[#333] px-8 py-4 sm:px-10 sm:py-5 text-lg font-bold uppercase tracking-widest text-[var(--foreground)] transition-all hover:bg-[#222] hover:border-[#555] hover:-translate-y-1 text-center shadow-lg"
            >
              Take a mock test
            </Link>
          </div>
        </section>

        {/* ── Features Section ── */}
        <section className="w-full max-w-6xl mx-auto py-16 sm:py-24 px-4 sm:px-6">
          <h2 className="heading text-3xl sm:text-4xl md:text-5xl font-bold text-center text-[var(--foreground)] mb-12 sm:mb-16">
            Why aspirants switch to us
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Card 1 */}
            <div className="card-elevated p-8 sm:p-10 border-2 border-[#333] bg-[#111] transition-transform hover:-translate-y-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#A78BFA]/10 blur-3xl rounded-full" />
              <div className="w-12 h-12 rounded-xl bg-[#2a2a2a] border border-[#444] flex items-center justify-center text-xl mb-6">📚</div>
              <h3 className="heading text-2xl mb-3 text-[var(--foreground)]">Real PYQ practice</h3>
              <p className="text-[var(--muted)] text-base mb-1 font-medium">Last 12+ years, all papers</p>
              <p className="text-[var(--muted)] text-base font-medium">Timed, exam-like</p>
            </div>
            
            {/* Card 2 */}
            <div className="card-elevated p-8 sm:p-10 border-2 border-[var(--accent)]/30 bg-[var(--accent)]/5 transition-transform hover:-translate-y-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)]/10 blur-3xl rounded-full" />
              <div className="w-12 h-12 rounded-xl bg-[var(--accent)]/20 border border-[var(--accent)]/50 flex items-center justify-center text-xl mb-6">📊</div>
              <h3 className="heading text-2xl mb-3 text-[var(--foreground)]">Smart analytics</h3>
              <p className="text-emerald-100/70 text-base mb-1 font-medium">Subject-wise weakness</p>
              <p className="text-emerald-100/70 text-base font-medium">Track improvement</p>
            </div>
            
            {/* Card 3 */}
            <div className="card-elevated p-8 sm:p-10 border-2 border-[#333] bg-[#111] transition-transform hover:-translate-y-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-3xl rounded-full" />
              <div className="w-12 h-12 rounded-xl bg-[#2a2a2a] border border-[#444] flex items-center justify-center text-xl mb-6">🔓</div>
              <h3 className="heading text-2xl mb-3 text-[var(--foreground)]">100% free</h3>
              <p className="text-[var(--muted)] text-base mb-1 font-medium">No paywall, no trial</p>
              <p className="text-[var(--muted)] text-base font-medium">Full access always</p>
            </div>
          </div>
        </section>

        {/* ── Dashboard Preview Section ── */}
        <section className="w-full max-w-6xl mx-auto py-16 sm:py-24 px-4 sm:px-6 flex flex-col items-center">
          <h2 className="heading text-3xl sm:text-4xl md:text-5xl font-bold text-center text-[var(--foreground)] mb-12">
            See it in action
          </h2>
          
          {/* Dashboard Code Mockup */}
          <div className="w-full max-w-5xl rounded-[2rem] overflow-hidden border border-[#333] shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-[#111] mb-16 sm:mb-20 transform transition-transform duration-700 hover:-translate-y-2">
            {/* Fake UI Header */}
            <div className="w-full h-14 bg-[#1a1a1a] border-b border-[#333] flex items-center px-6 gap-4">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
              </div>
              <div className="flex-1"></div>
              <div className="w-24 h-6 rounded bg-[#2a2a2a]"></div>
              <div className="w-8 h-8 rounded-full bg-[#2a2a2a]"></div>
            </div>
            
            {/* Fake UI Body */}
            <div className="p-6 sm:p-10 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {/* Left Column */}
              <div className="md:col-span-2 space-y-6 sm:space-y-8">
                {/* Top Stats */}
                <div className="grid grid-cols-3 gap-4 sm:gap-6">
                  <div className="p-5 sm:p-6 rounded-2xl border border-[#333] bg-[#161616]">
                    <div className="text-xs sm:text-sm text-[var(--muted)] mb-1 uppercase tracking-wider">Target Score</div>
                    <div className="text-3xl sm:text-4xl font-display text-[var(--foreground)]">115</div>
                  </div>
                  <div className="p-5 sm:p-6 rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent)]/5">
                    <div className="text-xs sm:text-sm text-[var(--accent)] mb-1 uppercase tracking-wider">Avg Score</div>
                    <div className="text-3xl sm:text-4xl font-display text-[var(--accent)]">102.5</div>
                  </div>
                  <div className="p-5 sm:p-6 rounded-2xl border border-[#333] bg-[#161616]">
                    <div className="text-xs sm:text-sm text-[var(--muted)] mb-1 uppercase tracking-wider">Accuracy</div>
                    <div className="text-3xl sm:text-4xl font-display text-[var(--foreground)]">76%</div>
                  </div>
                </div>
                
                {/* Chart Area */}
                <div className="p-6 sm:p-8 rounded-2xl border border-[#333] bg-[#161616] h-64 sm:h-72 flex flex-col justify-end gap-3 relative overflow-hidden">
                  <div className="absolute top-6 left-6 text-sm sm:text-base text-[var(--foreground)] font-semibold">Mock Test Progression (Last 10)</div>
                  <div className="flex items-end gap-2 sm:gap-3 h-40 sm:h-48 mt-auto w-full">
                     {/* Bars */}
                     {[40, 55, 45, 70, 65, 80, 75, 90, 85, 102].map((height, i) => (
                       <div key={i} className="flex-1 rounded-t-sm transition-all duration-1000 ease-out" style={{ height: `${height}%`, backgroundColor: i === 9 ? 'var(--accent)' : '#2a2a2a' }}></div>
                     ))}
                  </div>
                </div>
              </div>
              
              {/* Right Column */}
              <div className="space-y-6 sm:space-y-8 h-full">
                <div className="p-6 sm:p-8 rounded-2xl border border-[#333] bg-[#161616] h-full flex flex-col">
                  <div className="text-sm sm:text-base text-[var(--foreground)] font-semibold mb-6 sm:mb-8">Subject Weaknesses</div>
                  <div className="space-y-6 flex-1 flex flex-col justify-center">
                    {/* Weakness items */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-[var(--muted)]">Modern History</span>
                        <span className="text-red-400 font-medium">45%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#2a2a2a] overflow-hidden">
                        <div className="h-full bg-red-400" style={{ width: '45%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-[var(--muted)]">Environment</span>
                        <span className="text-yellow-400 font-medium">55%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#2a2a2a] overflow-hidden">
                        <div className="h-full bg-yellow-400" style={{ width: '55%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-[var(--muted)]">Economics</span>
                        <span className="text-[var(--accent)] font-medium">78%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#2a2a2a] overflow-hidden">
                        <div className="h-full bg-[var(--accent)]" style={{ width: '78%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-[var(--muted)]">Polity</span>
                        <span className="text-[var(--foreground)] font-medium">85%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#2a2a2a] overflow-hidden">
                        <div className="h-full bg-[#444]" style={{ width: '85%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Final CTA */}
          <div className="flex flex-col items-center text-center mt-4 border border-[#333] bg-[#111]/50 backdrop-blur-md rounded-3xl p-8 sm:p-12 w-full max-w-3xl">
            <h3 className="text-2xl sm:text-3xl font-display font-bold text-[var(--foreground)] mb-3">Ready to dive in?</h3>
            <p className="text-[var(--muted)] mb-8 max-w-md mx-auto">
              Join thousands of aspirants analyzing their real mock performance today.
            </p>
            <Link
              href="/app"
              className="group relative inline-flex items-center justify-center rounded-[1.25rem] bg-[var(--foreground)] px-10 py-5 text-lg font-bold uppercase tracking-widest text-[#0e0e0e] transition-all hover:bg-white hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.1)] mb-4 w-full sm:w-auto"
            >
              Start your first test now
            </Link>
            <p className="text-[var(--muted)] italic text-sm md:text-base opacity-80">
              No signup required. Practice first, create account later.
            </p>
          </div>
        </section>
        
      </main>
      
      {/* ── Footer ── */}
      <footer className="w-full border-t border-[#222] bg-[#0a0a0a] py-10 px-6 text-center text-[var(--muted)] text-sm mt-10">
        <p className="mb-2 uppercase tracking-widest text-xs font-bold opacity-60">Pattern: Hero + CTA + social proof + features + preview + final CTA.</p>
        <p>&copy; {new Date().getFullYear()} UPSCPT. The smartest way to practice.</p>
      </footer>
    </div>
  );
}
