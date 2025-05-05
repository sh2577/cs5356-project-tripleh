'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Snack } from '@/lib/api';

export default function FeedPage() {
  const [snacks, setSnacks] = useState<Snack[]>([]);
  const [index, setIndex] = useState(0);
  const [matchInfo, setMatchInfo] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/snacks/feed')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setSnacks(data);
      });
  }, []);

  const currentSnack = snacks[index];

  const handleSwipe = async (liked: boolean) => {
    if (!currentSnack) return;
    const res = await fetch('/api/swipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ swipedSnackId: currentSnack.id, liked }),
    });
    const data = await res.json();

    if (data.match) {
      setMatchInfo(`It's a match! You and someone both liked each other's snacks.`);
    }

    setIndex(index + 1);
  };

  return (
    <>
      <nav className="w-full bg-white shadow p-4 flex justify-between items-center border-b-2 border-amber-400">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-amber-600 flex items-center gap-2">Snack Swap <span className="text-2xl">🍪</span></h1>
        </div>
        <div className="space-x-6 text-sm">
          <a href="/swapsnack/feed" className="font-bold text-amber-600">Feed</a>
          <a href="/swapsnack/profile" className="text-amber-600/70 hover:text-amber-600">My Snacks</a>
          <a href="/swapsnack/matches" className="text-amber-600/70 hover:text-amber-600">Matches</a>
        </div>
      </nav>
      <div className="min-h-screen bg-yellow-50 flex flex-col justify-center items-center">
        <div className="flex-1 flex flex-col justify-center items-center w-full">
          <div className="w-full max-w-md mx-auto">
            <div className="w-full text-center mb-6">
              <span className="text-2xl font-bold uppercase tracking-widest text-amber-500">MATCH CARD TO MEET NEW FRIENDS</span>
            </div>
            <div className="relative h-[500px] flex flex-col justify-center items-center">
              <AnimatePresence>
                {currentSnack && (
                  <motion.div
                    key={currentSnack.id}
                    initial={{ x: 0, opacity: 1 }}
                    exit={{ x: false ? 300 : -300, opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="bg-white rounded-3xl shadow-xl border-2 border-amber-400 flex flex-col items-center p-8 w-full h-full"
                  >
                    <img src={currentSnack.imageUrl} className="w-full h-64 object-cover rounded-2xl mb-6 border border-amber-100" />
                    <h2 className="text-2xl font-extrabold mb-2 text-black text-center tracking-wider uppercase">{currentSnack.name}</h2>
                    <p className="text-base text-gray-500 mb-2 text-center">{currentSnack.location}</p>
                    <div className="w-full border-t-2 border-amber-100 my-2"></div>
                    <p className="text-base text-gray-700 text-center">{currentSnack.description}</p>
                  </motion.div>
                )}
              </AnimatePresence>
              {!currentSnack && (
                <div className="w-full flex flex-col items-center justify-center h-[300px] bg-white rounded-3xl shadow-xl border-2 border-amber-400 mt-8">
                  <span className="text-2xl font-bold text-gray-400 flex items-center gap-2">
                    NO MORE SNACK <span>😭</span>
                  </span>
                </div>
              )}
            </div>
            <div className="flex justify-center gap-8 mt-8">
              <button
                onClick={() => handleSwipe(false)}
                className="bg-gray-200 px-8 py-3 rounded-full text-gray-700 text-lg font-semibold hover:bg-gray-400 shadow transition"
              >
                Dislike
              </button>
              <button
                onClick={() => handleSwipe(true)}
                className="bg-amber-500 px-8 py-3 rounded-full text-white text-lg font-semibold hover:bg-amber-600 shadow transition"
              >
                Like
              </button>
            </div>
            {matchInfo && <p className="text-green-600 mt-6 text-center text-lg font-semibold">{matchInfo}</p>}
          </div>
        </div>
      </div>
    </>
  );
}
