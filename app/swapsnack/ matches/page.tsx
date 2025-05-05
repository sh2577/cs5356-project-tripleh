'use client';

import React from 'react';
import { useEffect, useState } from 'react';

type Match = {
  id: string;
  createdAt: string;
  otherUser: {
    id: string;
    name: string;
    image?: string;
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
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Your Matches 💞</h1>

      {error && <p className="text-red-500 text-center">{error}</p>}

      {matches.length === 0 ? (
        <p className="text-gray-500 text-center">No matches yet. Keep swiping!</p>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          {matches.map((match) => (
            <div key={match.id} className="bg-white rounded-xl shadow-md p-4">
              <div className="mb-2 text-sm text-gray-500">
                Matched with <span className="font-semibold">{match.otherUser.name}</span>
              </div>
              <div className="flex space-x-4">
                {/* Your snack */}
                <div className="flex-1 text-center">
                  <img
                    src={match.userSnack.imageUrl}
                    alt={match.userSnack.name}
                    className="h-32 w-full object-cover rounded-md mb-1"
                  />
                  <p className="text-sm font-medium">Your: {match.userSnack.name}</p>
                </div>

                {/* Their snack */}
                <div className="flex-1 text-center">
                  <img
                    src={match.otherUserSnack.imageUrl}
                    alt={match.otherUserSnack.name}
                    className="h-32 w-full object-cover rounded-md mb-1"
                  />
                  <p className="text-sm font-medium">Their: {match.otherUserSnack.name}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

