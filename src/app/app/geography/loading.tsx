export default function GeographyLoading() {
  return (
    <div className="flex items-center justify-center h-[calc(100dvh-56px)] lg:h-dvh bg-[#0F172A]">
      <div className="text-center">
        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4 animate-pulse">
          <svg className="w-6 h-6 text-[#475569]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </div>
        <p className="text-sm text-[#475569]">Loading Geography Lab...</p>
      </div>
    </div>
  );
}
