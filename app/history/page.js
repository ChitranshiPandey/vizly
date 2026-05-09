"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import Link from "next/link";

export default function History() {
  const { user } = useUser();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetch(`/api/history?userId=${user.id}`)
        .then((res) => res.json())
        .then((data) => {
          setHistory(data.history || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [user]);

  const clearHistory = async () => {
    if (!user) return;
    for (const item of history) {
      await fetch(`/api/history?id=${item.id}`, { method: "DELETE" });
    }
    setHistory([]);
  };

  return (
    <main
      className="min-h-screen text-white flex flex-col items-center px-4 py-16"
      style={{ background: "radial-gradient(ellipse at top, #0f1729 0%, #050810 100%)" }}
    >
      <div className="w-full max-w-3xl mb-8 flex items-center justify-between">
        <Link href="/" className="text-gray-400 hover:text-white text-sm transition">
          ← Back to Vizly
        </Link>
        {history.length > 0 && (
          <button onClick={clearHistory} className="text-red-400 hover:text-red-300 text-sm transition">
            🗑️ Clear History
          </button>
        )}
      </div>

      <motion.div className="text-center mb-12"
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-5xl mb-4">📚</div>
        <h1 className="text-4xl font-extrabold text-white mb-2">Your History</h1>
        <p className="text-gray-400">All topics you've explored on Vizly</p>
      </motion.div>

      <div className="w-full max-w-3xl flex flex-col gap-4">
        {loading ? (
          <div className="text-center py-16">
            <div className="w-10 h-10 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading history...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center text-gray-500 py-16">
            <p className="text-4xl mb-4">🔍</p>
            <p className="mb-4">No history yet!</p>
            <Link href="/" className="text-indigo-400 hover:text-indigo-300 transition">
              Search your first topic →
            </Link>
          </div>
        ) : (
          history.map((item, index) => (
            <motion.div key={item.id}
              className="rounded-2xl p-5"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{item.emoji || "🎬"}</span>
                    <h3 className="text-white font-bold">{item.topic}</h3>
                  </div>
                  <p className="text-gray-500 text-xs mb-3">
                    🕐 {new Date(item.created_at).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(item.scenes || []).map((scene, i) => (
                      <span key={i} className="text-xs px-2 py-1 rounded-full"
                        style={{ background: "rgba(99,102,241,0.1)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.2)" }}>
                        {scene.emoji} {scene.title}
                      </span>
                    ))}
                  </div>
                </div>
                {item.quiz_score !== null && item.quiz_score !== undefined && (
                  <div className="text-center px-3 py-2 rounded-xl shrink-0"
                    style={{ background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.2)" }}>
                    <p className="text-yellow-400 font-bold text-lg">{item.quiz_score}/5</p>
                    <p className="text-gray-500 text-xs">Quiz</p>
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </main>
  );
}






















// "use client";

// import { useEffect, useState } from "react";
// import { useUser } from "@clerk/nextjs";
// import { motion } from "framer-motion";
// import Link from "next/link";

// export default function History() {
//   const { user } = useUser();
//   const [history, setHistory] = useState([]);

//   useEffect(() => {
//     if (user) {
//       const data = JSON.parse(
//         localStorage.getItem(`vizly_history_${user.id}`) || "[]"
//       );
//       setHistory(data.reverse());
//     }
//   }, [user]);

//   const clearHistory = () => {
//     if (!user) return;
//     localStorage.removeItem(`vizly_history_${user.id}`);
//     setHistory([]);
//   };

//   return (
//     <main
//       className="min-h-screen text-white flex flex-col items-center px-4 py-16"
//       style={{ background: "radial-gradient(ellipse at top, #0f1729 0%, #050810 100%)" }}
//     >
//       {/* Back */}
//       <div className="w-full max-w-3xl mb-8 flex items-center justify-between">
//         <Link
//           href="/"
//           className="text-gray-400 hover:text-white text-sm transition flex items-center gap-2"
//         >
//           ← Back to Vizly
//         </Link>
//         {history.length > 0 && (
//           <button
//             onClick={clearHistory}
//             className="text-red-400 hover:text-red-300 text-sm transition"
//           >
//             🗑️ Clear History
//           </button>
//         )}
//       </div>

//       {/* Title */}
//       <motion.div
//         className="text-center mb-12"
//         initial={{ opacity: 0, y: -20 }}
//         animate={{ opacity: 1, y: 0 }}
//       >
//         <div className="text-5xl mb-4">📚</div>
//         <h1 className="text-4xl font-extrabold text-white mb-2">Your History</h1>
//         <p className="text-gray-400">All topics you've explored on Vizly</p>
//       </motion.div>

//       {/* History List */}
//       <div className="w-full max-w-3xl flex flex-col gap-4">
//         {history.length === 0 ? (
//           <div className="text-center text-gray-500 py-16">
//             <p className="text-4xl mb-4">🔍</p>
//             <p className="mb-4">No history yet!</p>
//             <Link
//               href="/"
//               className="text-indigo-400 hover:text-indigo-300 transition"
//             >
//               Search your first topic →
//             </Link>
//           </div>
//         ) : (
//           history.map((item, index) => (
//             <motion.div
//               key={index}
//               className="rounded-2xl p-5"
//               style={{
//                 background: "rgba(255,255,255,0.03)",
//                 border: "1px solid rgba(255,255,255,0.08)",
//               }}
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: index * 0.05 }}
//             >
//               <div className="flex items-start justify-between gap-4">
//                 <div className="flex-1">
//                   <div className="flex items-center gap-2 mb-2">
//                     <span className="text-2xl">{item.emoji || "🎬"}</span>
//                     <h3 className="text-white font-bold">{item.topic}</h3>
//                   </div>
//                   <p className="text-gray-500 text-xs mb-3">
//                     🕐 {new Date(item.date).toLocaleDateString("en-IN", {
//                       day: "numeric",
//                       month: "short",
//                       year: "numeric",
//                       hour: "2-digit",
//                       minute: "2-digit",
//                     })}
//                   </p>

//                   {/* Scene titles */}
//                   <div className="flex flex-wrap gap-2">
//                     {(item.scenes || []).map((scene, i) => (
//                       <span
//                         key={i}
//                         className="text-xs px-2 py-1 rounded-full"
//                         style={{
//                           background: "rgba(99,102,241,0.1)",
//                           color: "#818cf8",
//                           border: "1px solid rgba(99,102,241,0.2)",
//                         }}
//                       >
//                         {scene.emoji} {scene.title}
//                       </span>
//                     ))}
//                   </div>
//                 </div>

//                 {/* Quiz score if available */}
//                 {item.quizScore !== undefined && (
//                   <div
//                     className="text-center px-3 py-2 rounded-xl shrink-0"
//                     style={{
//                       background: "rgba(234,179,8,0.1)",
//                       border: "1px solid rgba(234,179,8,0.2)",
//                     }}
//                   >
//                     <p className="text-yellow-400 font-bold text-lg">
//                       {item.quizScore}/5
//                     </p>
//                     <p className="text-gray-500 text-xs">Quiz</p>
//                   </div>
//                 )}
//               </div>
//             </motion.div>
//           ))
//         )}
//       </div>
//     </main>
//   );
// }