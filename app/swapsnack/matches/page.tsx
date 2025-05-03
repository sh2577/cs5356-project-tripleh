'use client';

import { useEffect, useState } from 'react';

type Match = {
  id: string;
  createdAt: string;
  otherUser: {
    id: string;
    name: string;
    image?: string;
    email?: string;
  };
  userSnack: {
    id: string;
    name: string;
    imageUrl: string;
  };
  otherUserSnack: {
    id: string;
    name: string;
    imageUrl: string;
  };
};

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/matches')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setMatches(data);
        else setError('Failed to load matches');
      })
      .catch(() => setError('Failed to load matches'));
  }, []);

  return (
    <>
      <nav className="w-full bg-white shadow p-4 flex justify-between items-center border-b-2 border-amber-400">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-amber-600 flex items-center gap-2">Snack Swap <span className="text-2xl">🍪</span></h1>
        </div>
        <div className="space-x-6 text-sm">
          <a href="/swapsnack/feed" className="text-amber-600/70 hover:text-amber-600">Feed</a>
          <a href="/swapsnack/profile" className="text-amber-600/70 hover:text-amber-600">My Snacks</a>
          <a href="/swapsnack/matches" className="font-bold text-amber-600">Matches</a>
        </div>
      </nav>

      <div className="min-h-screen bg-gray-50 p-6">
        <h1 className="text-3xl font-bold text-amber-600 text-center mb-6">Your Matches</h1>

        {error && <p className="text-red-500 text-center">{error}</p>}

        {matches.length === 0 ? (
          <p className="text-gray-500 text-center">No matches yet. Keep swiping!</p>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            {matches.map((match) => (
              <div key={match.id} className="bg-white rounded-2xl shadow-lg border-2 border-amber-400 p-6 flex flex-col items-center">
                <div className="text-center text-base font-bold text-amber-600 mb-1">
                  Matched with <span className="font-semibold">{match.otherUser.name}</span>
                </div>
                {match.otherUser.email && (
                  <div className="text-xs text-gray-400 mb-3 text-center break-all">
                    📧 {match.otherUser.email}
                  </div>
                )}
                <div className="flex gap-6 w-full">
                  {/* Your snack */}
                  <div className="flex-1 bg-amber-50 rounded-xl p-3 shadow border border-amber-100 flex flex-col items-center">
                    <img
                      src={match.userSnack.imageUrl}
                      alt={match.userSnack.name}
                      className="h-28 w-full object-cover rounded-lg shadow mb-2 border border-amber-100"
                    />
                    <p className="text-sm font-semibold text-black text-center">Your: {match.userSnack.name}</p>
                  </div>

                  {/* Their snack */}
                  <div className="flex-1 bg-amber-50 rounded-xl p-3 shadow border border-amber-100 flex flex-col items-center">
                    <img
                      src={match.otherUserSnack.imageUrl}
                      alt={match.otherUserSnack.name}
                      className="h-28 w-full object-cover rounded-lg shadow mb-2 border border-amber-100"
                    />
                    <p className="text-sm font-semibold text-black text-center">Their: {match.otherUserSnack.name}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
