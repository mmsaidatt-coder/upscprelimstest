export default function GeographyLoading() {
  return (
    <div className="flex h-dvh items-center justify-center bg-[#151a16]">
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 animate-pulse items-center justify-center border border-[#374138] bg-[#1d241e]">
          <svg className="h-6 w-6 text-[#ef5c49]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </div>
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#a6aaa1]">Preparing the India atlas</p>
      </div>
    </div>
  );
}
