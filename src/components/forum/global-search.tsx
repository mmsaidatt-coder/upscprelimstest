"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // For now we just push them to the community if it exists, or maybe a dedicated search page
      // To keep it simple, we search on the spot or redirect to a search results feed.
      // Let's redirect to forum homepage with ?q=
      router.push(`/app/forum?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative w-full max-w-2xl mx-auto mb-8">
      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted">
        <Search className="w-5 h-5" />
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full text-base py-4 pl-12 pr-4 bg-white/50 backdrop-blur-md border border-border/80 rounded-2xl shadow-sm outline-none focus:bg-white focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
        placeholder="Search communities, topics, or posts..."
      />
      <button 
        type="submit"
        className="absolute inset-y-2 right-2 px-4 bg-accent text-white font-medium rounded-xl hover:bg-accent/90 transition-colors"
      >
        Search
      </button>
    </form>
  );
}
