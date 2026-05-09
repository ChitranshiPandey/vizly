"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import Link from "next/link";

export default function Leaderboard() {
  const { user } = useUser();
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    // Get all leaderboard data from localStorage
    const data = JSON.parse(localStorage.getItem("vizly_leaderboard") || "[]");
    const sorted = data.sort((a, b) => b.stars - a.stars);
    setLeaderboard(sorted);
  }, []);

  return (
    <main
      className="min-h-screen text-white flex flex-col items-center px-4 py-16"
      style={{ background: "radial-gradient(ellipse at top, #0f1729 0%, #050810 100%)" }}
    >
      {/* Back button */}
      <div className="w-full max-w-2xl mb-8">
        <Link
          href="/"
          className="text-gray-400 hover:text-white text-sm transition flex items-center gap-2"
        >
          ← Back to Vizly
        </Link>
      </div>

      {/* Title */}
      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-6xl mb-4">🏆</div>
        <h1 className="text-4xl font-extrabold text-white mb-2">Leaderboard</h1>
        <p className="text-gray-400">Top learners ranked by stars earned</p>
      </motion.div>

      {/* Leaderboard */}
      <div className="w-full max-w-2xl flex flex-col gap-3">
        {leaderboard.length === 0 ? (
          <div className="text-center text-gray-500 py-16">
            <p className="text-4xl mb-4">🌟</p>
            <p>No entries yet! Take a quiz to get on the board.</p>
          </div>
        ) : (
          leaderboard.map((entry, index) => (
            <motion.div
              key={entry.userId}
              className="flex items-center gap-4 rounded-2xl p-5"
              style={{
                background: entry.userId === user?.id
                  ? "rgba(99,102,241,0.1)"
                  : "rgba(255,255,255,0.03)",
                border: entry.userId === user?.id
                  ? "1px solid rgba(99,102,241,0.3)"
                  : "1px solid rgba(255,255,255,0.06)",
              }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {/* Rank */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-lg shrink-0"
                style={{
                  background: index === 0
                    ? "linear-gradient(135deg, #f59e0b, #ef4444)"
                    : index === 1
                    ? "rgba(156,163,175,0.2)"
                    : index === 2
                    ? "rgba(180,83,9,0.2)"
                    : "rgba(255,255,255,0.05)",
                  color: index === 0 ? "white"
                    : index === 1 ? "#9ca3af"
                    : index === 2 ? "#b45309"
                    : "#6b7280",
                }}
              >
                {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
              </div>

              {/* Avatar */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                style={{ background: "rgba(99,102,241,0.2)", color: "#818cf8" }}
              >
                {entry.name?.charAt(0)?.toUpperCase() || "?"}
              </div>

              {/* Name */}
              <div className="flex-1">
                <p className="text-white font-semibold text-sm">
                  {entry.name}
                  {entry.userId === user?.id && (
                    <span
                      className="ml-2 text-xs px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(99,102,241,0.2)", color: "#818cf8" }}
                    >
                      You
                    </span>
                  )}
                </p>
                <p className="text-gray-500 text-xs">{entry.quizzesTaken} quizzes taken</p>
              </div>

              {/* Stars */}
              <div
                className="flex items-center gap-1 px-3 py-1 rounded-full font-bold text-sm"
                style={{ background: "rgba(234,179,8,0.15)", color: "#fbbf24" }}
              >
                ⭐ {entry.stars}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </main>
  );
}