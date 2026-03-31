import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="bg-[#121212] min-h-screen font-sans text-gray-100 flex flex-col">
      {/* ── Navigation Header ── */}
      <header className="w-full flex justify-between items-center py-5 px-6 sm:px-12 bg-[#1f1f1f] border-b border-[#333]">
        <div className="flex items-center gap-2">
          <Link href="/">
            <span className="text-[1.3rem] font-display font-black tracking-wider text-white uppercase hover:text-[var(--accent)] transition-colors">
              UPSCPT
            </span>
          </Link>
        </div>
        <div>
          <Link href="/login" className="text-sm font-semibold text-gray-300 hover:text-white transition-colors">
            Login / Sign up
          </Link>
        </div>
      </header>

      <main className="flex-1 w-full">
        {/* ── Hero Section ── */}
        <section className="bg-[#0f2e24] w-full py-24 px-4 sm:px-6 flex flex-col items-center justify-center border-b border-[#1f4a3a]">
          <span className="text-emerald-400 text-sm md:text-base font-medium mb-6 uppercase tracking-wider">
            100% free practice platform
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-center text-white max-w-4xl tracking-tight leading-[1.15] mb-8 font-display">
            Practice UPSC Prelims with real PYQs and detailed analytics
          </h1>
          <p className="text-emerald-100/70 text-base md:text-lg text-center font-medium mb-12">
            15,000+ questions | 12+ years of PYQs | Full-length mock tests
          </p>
          
          <div className="flex flex-col sm:flex-row gap-5">
            <Link
              href="/app/pyq"
              className="bg-[#2d5a27] hover:bg-[#3d7a35] border border-[#4d8f44] text-white font-semibold py-4 px-8 rounded-xl transition-all shadow-[0_4px_14px_0_rgba(45,90,39,0.39)] hover:shadow-[0_6px_20px_rgba(45,90,39,0.23)] hover:-translate-y-[2px] text-center"
            >
              Start PYQ practice
            </Link>
            <Link
              href="/app/flt"
              className="bg-[#3b3b3b] hover:bg-[#4b4b4b] border border-[#555] text-white font-semibold py-4 px-8 rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-[2px] text-center"
            >
              Take a mock test
            </Link>
          </div>
        </section>

        {/* ── Features Section ── */}
        <section className="w-full max-w-5xl mx-auto py-24 px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-white mb-12 font-display">
            Why aspirants switch to us
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-[#2f2762] rounded-2xl p-8 border border-[#403682] transition-transform hover:-translate-y-2">
              <h3 className="text-xl font-bold text-white mb-3">Real PYQ practice</h3>
              <p className="text-indigo-200/80 mb-1">Last 12+ years, all papers</p>
              <p className="text-indigo-200/80">Timed, exam-like</p>
            </div>
            
            {/* Card 2 */}
            <div className="bg-[#0b3b2c] rounded-2xl p-8 border border-[#145f48] transition-transform hover:-translate-y-2">
              <h3 className="text-xl font-bold text-white mb-3">Smart analytics</h3>
              <p className="text-emerald-200/80 mb-1">Subject-wise weakness</p>
              <p className="text-emerald-200/80">Track improvement</p>
            </div>
            
            {/* Card 3 */}
            <div className="bg-[#4a1c0d] rounded-2xl p-8 border border-[#762b14] transition-transform hover:-translate-y-2">
              <h3 className="text-xl font-bold text-white mb-3">100% free</h3>
              <p className="text-orange-200/80 mb-1">No paywall, no trial</p>
              <p className="text-orange-200/80">Full access always</p>
            </div>
          </div>
        </section>

        {/* ── Dashboard Preview Section ── */}
        <section className="w-full max-w-6xl mx-auto pb-24 px-4 sm:px-6 flex flex-col items-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-white mb-10 font-display">
            See it in action
          </h2>
          
          {/* Dashboard Image */}
          <div className="w-full max-w-5xl rounded-2xl sm:rounded-[2rem] overflow-hidden border-2 border-[#333] shadow-2xl relative mb-16 bg-black">
            <div className="absolute inset-0 bg-gradient-to-t from-[#121212]/80 via-transparent to-transparent pointer-events-none z-10" />
            <Image 
              src="/dashboard-preview.png"
              alt="UPSC Analytics Dashboard Preview"
              width={1400}
              height={900}
              className="w-full h-auto object-cover transform transition-transform duration-700 hover:scale-[1.02]"
              priority
            />
          </div>

          {/* Final CTA */}
          <div className="flex flex-col items-center text-center">
            <Link
              href="/app"
              className="bg-[#265e1b] hover:bg-[#327a24] text-white text-lg font-bold py-5 px-10 rounded-2xl transition-all mb-4 shadow-[0_0_30px_rgba(45,90,39,0.3)] hover:shadow-[0_0_40px_rgba(45,90,39,0.5)] hover:-translate-y-1 w-full sm:w-auto"
            >
              Start your first test now
            </Link>
            <p className="text-gray-400 italic text-sm md:text-base">
              No signup required. Practice first, create account later.
            </p>
          </div>
        </section>
        
      </main>
      
      {/* ── Footer ── */}
      <footer className="w-full border-t border-[#222] py-8 text-center text-[#666] text-sm">
        <p>Pattern: Hero + CTA + social proof + features + preview + final CTA. Every top landing page uses this.</p>
        <p className="mt-2 text-[#444]">&copy; {new Date().getFullYear()} UPSCPT.</p>
      </footer>
    </div>
  );
}
