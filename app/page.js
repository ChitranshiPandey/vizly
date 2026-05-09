"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import jsPDF from "jspdf";

const SUGGESTED_TOPICS = [
  { emoji: "🤖", label: "The Future of AI" },
  { emoji: "🪐", label: "Life in Mars" },
  { emoji: "🌊", label: "Oceans of Earth" },
  { emoji: "🏛️", label: "Ancient Civilizations" },
];

export default function Home() {
  const { user } = useUser();
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [scenes, setScenes] = useState([]);
  const [currentScene, setCurrentScene] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState({});
  const [muted, setMuted] = useState(false);
  const [language, setLanguage] = useState("indian");
  const [showHelp, setShowHelp] = useState(false);
  const [quiz, setQuiz] = useState([]);
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [stars, setStars] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [totalStars, setTotalStars] = useState(0);
  const [totalQuizzes, setTotalQuizzes] = useState(0);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const utteranceRef = useRef(null);

  useEffect(() => {
    if (user) {
      fetch(`/api/user?userId=${user.id}`)
        .then((res) => res.json())
        .then((data) => {
          setTotalStars(data.stars || 0);
          setTotalQuizzes(data.quizzes || 0);
        })
        .catch(() => {});
    }
  }, [user]);

  const saveStars = async (earnedStars) => {
    if (!user) return;
    try {
      await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          name: user.fullName || user.firstName || "Anonymous",
          stars: earnedStars,
          quizzes: 1,
        }),
      });
      const res = await fetch(`/api/user?userId=${user.id}`);
      const data = await res.json();
      setTotalStars(data.stars || 0);
      setTotalQuizzes(data.quizzes || 0);
    } catch (err) {
      console.error("Error saving stars:", err);
    }
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;
    doc.setFillColor(13, 17, 23);
    doc.rect(0, 0, pageWidth, 297, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("Vizly Notes", 20, y);
    y += 10;
    doc.setFontSize(14);
    doc.setTextColor(148, 163, 184);
    doc.text(`Topic: ${topic}`, 20, y);
    y += 6;
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, y);
    y += 15;
    doc.setDrawColor(99, 102, 241);
    doc.setLineWidth(0.5);
    doc.line(20, y, pageWidth - 20, y);
    y += 10;
    scenes.forEach((scene, index) => {
      if (y > 240) {
        doc.addPage();
        doc.setFillColor(13, 17, 23);
        doc.rect(0, 0, pageWidth, 297, "F");
        y = 20;
      }
      doc.setFillColor(30, 30, 60);
      doc.roundedRect(15, y - 5, pageWidth - 30, 10, 2, 2, "F");
      doc.setTextColor(129, 140, 248);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(`SCENE ${index + 1}`, 20, y + 2);
      y += 12;
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.text(`${scene.title}`, 20, y);
      y += 8;
      doc.setTextColor(156, 163, 175);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const descLines = doc.splitTextToSize(scene.description, pageWidth - 40);
      doc.text(descLines, 20, y);
      y += descLines.length * 5 + 5;
      if (scene.keyPoints && scene.keyPoints.length > 0) {
        doc.setTextColor(129, 140, 248);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Key Points:", 20, y);
        y += 6;
        scene.keyPoints.forEach((point, i) => {
          doc.setTextColor(209, 213, 219);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          const pointLines = doc.splitTextToSize(`${i + 1}. ${point}`, pageWidth - 50);
          doc.text(pointLines, 25, y);
          y += pointLines.length * 5 + 2;
        });
        y += 3;
      }
      if (scene.didYouKnow) {
        if (y > 250) {
          doc.addPage();
          doc.setFillColor(13, 17, 23);
          doc.rect(0, 0, pageWidth, 297, "F");
          y = 20;
        }
        doc.setTextColor(251, 191, 36);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("Did You Know?", 20, y);
        y += 5;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(209, 213, 219);
        const dykLines = doc.splitTextToSize(scene.didYouKnow, pageWidth - 40);
        doc.text(dykLines, 20, y);
        y += dykLines.length * 5 + 8;
      }
      doc.setDrawColor(40, 40, 60);
      doc.setLineWidth(0.3);
      doc.line(20, y, pageWidth - 20, y);
      y += 10;
    });
    doc.setTextColor(75, 85, 99);
    doc.setFontSize(8);
    doc.text("Generated by Vizly — Learn Anything Visually", 20, 285);
    doc.save(`vizly-${topic.replace(/\s+/g, "-").toLowerCase()}.pdf`);
  };

  const speakScene = (scene, index) => {
    window.speechSynthesis.cancel();
    if (muted) return;
    const text = `Scene ${scene.id}. ${scene.title}. ${scene.description}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.85;
    utterance.pitch = 1.1;
    utterance.volume = 1;
    const voices = window.speechSynthesis.getVoices();
    const voice = language === "indian"
      ? voices.find((v) => v.name === "Microsoft Heera - English (India)") ||
        voices.find((v) => v.name === "Microsoft Heera")
      : voices.find((v) => v.name === "Google UK English Female") ||
        voices.find((v) => v.name === "Microsoft Hazel - English (United Kingdom)");
    if (voice) utterance.voice = voice;
    utterance.onend = () => {
      if (index < scenes.length - 1) {
        setCurrentScene(index + 1);
      } else {
        setPlaying(false);
      }
    };
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (playing && scenes.length > 0 && scenes[currentScene]) {
      speakScene(scenes[currentScene], currentScene);
    }
  }, [playing, currentScene, language]);

  useEffect(() => {
    if (muted) window.speechSynthesis.cancel();
  }, [muted]);

  const handleSubmit = async () => {
    if (!topic.trim()) return;
    window.speechSynthesis.cancel();
    setLoading(true);
    setError("");
    setScenes([]);
    setCurrentScene(0);
    setPlaying(false);
    setImagesLoaded({});
    setQuiz([]);
    setStars(0);
    setQuizFinished(false);
    setQuizScore(0);
    try {
      const res = await fetch("/api/generate-scenes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setScenes(data.scenes);
      setQuiz(data.quiz || []);
      if (user) {
        await fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            topic,
            emoji: data.scenes[0]?.emoji || "🎬",
            scenes: data.scenes.map((s) => ({ title: s.title, emoji: s.emoji })),
          }),
        });
      }
      data.scenes.forEach((scene, index) => {
        const img = new window.Image();
        img.src = scene.imageUrl;
        img.onload = () => setImagesLoaded((prev) => ({ ...prev, [index]: true }));
        img.onerror = () => setImagesLoaded((prev) => ({ ...prev, [index]: true }));
      });
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = () => { setCurrentScene(0); setPlaying(true); };
  const handlePause = () => { setPlaying(false); window.speechSynthesis.cancel(); };
  const handleSceneClick = (index) => {
    window.speechSynthesis.cancel();
    setCurrentScene(index);
    setPlaying(false);
  };

  const scene = scenes[currentScene];

  return (
    <main
      className="min-h-screen text-white flex flex-col items-center px-3 sm:px-4 pb-16"
      style={{
        background: "linear-gradient(135deg, #0a0015 0%, #0d0028 40%, #050810 100%)",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Animated background grid */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `
            linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }} />
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.15) 0%, transparent 70%)",
        }} />
      </div>

      {/* Navbar */}
      <div
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-8 py-4"
        style={{
          background: "rgba(10,0,21,0.8)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(139,92,246,0.15)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="text-2xl font-extrabold"
            style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            ⚡ Vizly
          </span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold"
            style={{ background: "rgba(234,179,8,0.15)", border: "1px solid rgba(234,179,8,0.25)", color: "#fbbf24" }}>
            ⭐ {totalStars} Stars
          </div>
          <Link href="/leaderboard"
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0" }}>
            🏆 Leaderboard
          </Link>
          <Link href="/history"
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0" }}>
            📚 History
          </Link>
          <button onClick={() => setShowHelp(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0" }}>
            ❓ How to use
          </button>
          <UserButton afterSignOutUrl="/sign-in" />
        </div>

        {/* Mobile Nav */}
        <div className="flex md:hidden items-center gap-3">
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold"
            style={{ background: "rgba(234,179,8,0.15)", color: "#fbbf24" }}>
            ⭐ {totalStars}
          </div>
          <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="text-gray-400 p-1">
            {showMobileMenu ? "✕" : "☰"}
          </button>
          <UserButton afterSignOutUrl="/sign-in" />
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="fixed top-16 left-0 right-0 z-40 md:hidden flex flex-col gap-1 p-4"
          style={{ background: "rgba(10,0,21,0.97)", borderBottom: "1px solid rgba(139,92,246,0.15)" }}>
          <Link href="/leaderboard" onClick={() => setShowMobileMenu(false)}
            className="text-gray-300 py-3 px-4 rounded-xl text-sm">🏆 Leaderboard</Link>
          <Link href="/history" onClick={() => setShowMobileMenu(false)}
            className="text-gray-300 py-3 px-4 rounded-xl text-sm">📚 History</Link>
          <button onClick={() => { setShowHelp(true); setShowMobileMenu(false); }}
            className="text-gray-300 py-3 px-4 rounded-xl text-sm text-left">❓ How to use</button>
        </div>
      )}

      <div className="h-24 relative z-10" />

      {/* Hero Section */}
      {scenes.length === 0 && (
        <motion.div
          className="relative z-10 w-full max-w-4xl flex flex-col items-center text-center px-4"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm mb-6"
            style={{
              background: "rgba(139,92,246,0.15)",
              border: "1px solid rgba(139,92,246,0.3)",
              color: "#c4b5fd",
            }}>
            ✦ Powered by AI
          </div>

          {/* Title */}
          <h1 className="text-6xl sm:text-8xl font-extrabold mb-4 leading-none"
            style={{
              background: "linear-gradient(135deg, #f472b6 0%, #a855f7 50%, #6366f1 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
            Vizly
          </h1>

          <p className="text-xl sm:text-2xl font-semibold text-white mb-2">
            Turn your ideas into cinematic visual stories
          </p>
          <p className="text-gray-400 text-base mb-8">
            Type any topic and watch it transform with AI magic ✨
          </p>

          {/* User Stats */}
          {user && (
            <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
              <div className="flex items-center gap-3 px-5 py-3 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <span className="text-2xl">👋</span>
                <div className="text-left">
                  <p className="text-white font-bold text-sm">Hey, {user.firstName || "Learner"}!</p>
                  <p className="text-gray-400 text-xs">Ready to create something amazing?</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-5 py-3 rounded-2xl"
                style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)" }}>
                <span className="text-2xl">⭐</span>
                <div className="text-left">
                  <p className="text-yellow-400 font-bold text-lg">{totalStars}</p>
                  <p className="text-gray-400 text-xs">Stars Earned</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-5 py-3 rounded-2xl"
                style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}>
                <span className="text-2xl">🧠</span>
                <div className="text-left">
                  <p className="text-indigo-400 font-bold text-lg">{totalQuizzes}</p>
                  <p className="text-gray-400 text-xs">Quizzes Taken</p>
                </div>
              </div>
            </div>
          )}

          {/* Input Card */}
          <div className="w-full max-w-3xl rounded-3xl p-6"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(139,92,246,0.2)",
              backdropFilter: "blur(20px)",
            }}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xl">✦</span>
              <div>
                <p className="text-white font-bold text-sm">What's on your mind?</p>
                <p className="text-gray-500 text-xs">Describe any topic, concept, or story idea...</p>
              </div>
            </div>

            <textarea
              className="w-full text-white rounded-2xl p-4 text-base resize-none focus:outline-none transition mb-4"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(139,92,246,0.2)",
              }}
              rows={3}
              placeholder="e.g. How does a black hole form?"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />

            {/* Suggested Topics */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-gray-500 text-xs flex items-center gap-1">✦ Try these</span>
              {SUGGESTED_TOPICS.map((t) => (
                <button
                  key={t.label}
                  onClick={() => setTopic(t.label)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition hover:scale-105"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "#e2e8f0",
                  }}>
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end">
              <button
                onClick={handleSubmit}
                disabled={loading || !topic.trim()}
                className="flex items-center gap-2 px-8 py-4 rounded-2xl text-white font-bold text-base transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: loading || !topic.trim()
                    ? "rgba(139,92,246,0.3)"
                    : "linear-gradient(135deg, #a855f7, #6366f1)",
                  boxShadow: loading || !topic.trim() ? "none" : "0 0 30px rgba(139,92,246,0.5)",
                }}>
                {loading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>🎬 Vizly It!</>
                )}
              </button>
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center mt-3">
                {error.includes("retry") || error.includes("429")
                  ? "⏳ Too many requests — please wait 1 minute."
                  : `❌ ${error}`}
              </p>
            )}
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10 w-full max-w-3xl">
            {[
              { icon: "🚀", title: "AI-Powered Magic", desc: "Advanced AI turns your ideas into stunning visual stories", color: "#a855f7" },
              { icon: "🎨", title: "Cinematic Visuals", desc: "Beautiful, high-quality visuals that bring your ideas to life", color: "#f472b6" },
              { icon: "⚡", title: "Instant Creation", desc: "From idea to story in seconds, not hours", color: "#fbbf24" },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl p-5 text-left"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="text-3xl mb-3">{f.icon}</div>
                <p className="font-bold text-sm mb-1" style={{ color: f.color }}>{f.title}</p>
                <p className="text-gray-400 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Quote */}
          <div className="mt-10 text-center max-w-lg">
            <p className="text-gray-400 text-base italic">
              <span className="text-purple-400 text-2xl">"</span>
              The best way to predict the future is to create it.
              <span className="text-purple-400 text-2xl">"</span>
            </p>
            <p className="text-gray-600 text-sm mt-1">— Peter Drucker</p>
          </div>
        </motion.div>
      )}

      {/* Player */}
      {scenes.length > 0 && scene && (
        <motion.div
          className="relative z-10 w-full max-w-6xl"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Input bar at top when scenes showing */}
          <div className="flex gap-3 mb-6">
            <input
              className="flex-1 text-white rounded-2xl px-4 py-3 text-sm focus:outline-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(139,92,246,0.2)" }}
              placeholder="Try another topic..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
            <button onClick={handleSubmit} disabled={loading || !topic.trim()}
              className="px-6 py-3 rounded-2xl text-white font-bold text-sm transition disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)" }}>
              {loading ? "⏳" : "🎬 Vizly It!"}
            </button>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-8 rounded-full" style={{ background: "linear-gradient(#a855f7, #6366f1)" }} />
            <h2 className="text-base sm:text-xl font-bold text-white truncate">{topic}</h2>
          </div>

          <div className="flex flex-col lg:flex-row gap-4">
            {/* Image */}
            <div className="relative rounded-3xl overflow-hidden flex-1"
              style={{
                aspectRatio: "16/9",
                boxShadow: "0 0 60px rgba(139,92,246,0.3), 0 25px 50px rgba(0,0,0,0.8)",
                minWidth: 0,
              }}>
              <AnimatePresence mode="wait">
                <motion.div key={currentScene} className="absolute inset-0"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}>
                  {!imagesLoaded[currentScene] && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10"
                      style={{ background: "#0a0015" }}>
                      <div className="w-10 h-10 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                      <p className="text-gray-400 text-sm">Loading image...</p>
                    </div>
                  )}
                  <motion.img src={scene.imageUrl} alt={scene.title}
                    className="w-full h-full object-cover"
                    initial={{ scale: 1 }}
                    animate={{ scale: [1, 1.08], x: currentScene % 2 === 0 ? [0, -20] : [0, 20], y: [0, -10] }}
                    transition={{ duration: 8, ease: "easeInOut" }}
                    onLoad={() => setImagesLoaded((prev) => ({ ...prev, [currentScene]: true }))}
                    onError={() => setImagesLoaded((prev) => ({ ...prev, [currentScene]: true }))}
                  />
                  <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
                    {playing && (
                      <div className="flex items-center gap-2 bg-black/60 backdrop-blur rounded-full px-3 py-1">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-white text-xs">LIVE</span>
                      </div>
                    )}
                    <div className="ml-auto bg-black/60 backdrop-blur rounded-full px-3 py-1 text-white text-sm">
                      {currentScene + 1} / {scenes.length}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Notes */}
            <AnimatePresence mode="wait">
              <motion.div key={`info-${currentScene}`}
                className="lg:w-96 flex flex-col gap-3"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}>
                <div className="rounded-2xl p-5"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(139,92,246,0.15)" }}>
                  <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold mb-3"
                    style={{ background: "rgba(139,92,246,0.15)", color: "#c4b5fd" }}>
                    Scene {currentScene + 1} of {scenes.length}
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{scene.emoji}</span>
                    <h3 className="text-xl font-extrabold text-white leading-tight">{scene.title}</h3>
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed mt-3">{scene.description}</p>
                </div>

                <div className="rounded-2xl p-5"
                  style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span>📌</span>
                    <h4 className="text-indigo-400 text-xs font-bold uppercase tracking-widest">Key Points</h4>
                  </div>
                  <ul className="flex flex-col gap-2">
                    {(scene.keyPoints || []).map((point, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-indigo-400 font-bold text-sm mt-0.5">{i + 1}.</span>
                        <span className="text-gray-300 text-sm leading-relaxed">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {scene.didYouKnow && (
                  <div className="rounded-2xl p-5"
                    style={{ background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.2)" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span>💡</span>
                      <h4 className="text-yellow-400 text-xs font-bold uppercase tracking-widest">Did You Know?</h4>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed">{scene.didYouKnow}</p>
                  </div>
                )}

                <div className="flex gap-2 px-1">
                  {scenes.map((_, i) => (
                    <button key={i} onClick={() => handleSceneClick(i)}
                      className="transition-all rounded-full"
                      style={{
                        width: i === currentScene ? "24px" : "8px",
                        height: "8px",
                        background: i === currentScene
                          ? "linear-gradient(90deg, #a855f7, #6366f1)"
                          : "rgba(255,255,255,0.2)",
                      }} />
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Progress Bars */}
          <div className="flex gap-2 mt-4">
            {scenes.map((_, index) => (
              <div key={index} className="h-1 flex-1 rounded-full overflow-hidden cursor-pointer"
                style={{ background: "rgba(255,255,255,0.1)" }}
                onClick={() => handleSceneClick(index)}>
                <motion.div className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #a855f7, #6366f1)" }}
                  animate={{ width: index < currentScene ? "100%" : index === currentScene ? "50%" : "0%" }}
                  transition={{ duration: 0.3 }} />
              </div>
            ))}
          </div>

          {/* Controls */}
          <div className="mt-4">
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 mb-3">
              {!playing ? (
                <button onClick={handlePlay}
                  className="col-span-2 sm:col-span-1 text-white font-bold px-6 py-3 rounded-xl text-sm"
                  style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)", boxShadow: "0 0 20px rgba(139,92,246,0.4)" }}>
                  ▶ Play Story
                </button>
              ) : (
                <button onClick={handlePause}
                  className="col-span-2 sm:col-span-1 text-white font-bold px-6 py-3 rounded-xl text-sm"
                  style={{ background: "rgba(234,179,8,0.2)", border: "1px solid rgba(234,179,8,0.4)" }}>
                  ⏸ Pause
                </button>
              )}
              <button onClick={() => { setMuted(!muted); window.speechSynthesis.cancel(); }}
                className="text-white py-3 px-4 rounded-xl text-sm font-semibold"
                style={{
                  background: muted ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.05)",
                  border: muted ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(255,255,255,0.1)",
                }}>
                {muted ? "🔇 Muted" : "🔊 Voice"}
              </button>
              <button onClick={() => { setLanguage(language === "indian" ? "british" : "indian"); window.speechSynthesis.cancel(); }}
                className="text-white py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold"
                style={{
                  background: language === "indian" ? "rgba(255,165,0,0.2)" : "rgba(99,102,241,0.2)",
                  border: language === "indian" ? "1px solid rgba(255,165,0,0.4)" : "1px solid rgba(99,102,241,0.4)",
                }}>
                {language === "indian" ? "🇮🇳 Indian" : "🇬🇧 British"}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => handleSceneClick(Math.max(0, currentScene - 1))}
                disabled={currentScene === 0}
                className="text-white py-3 rounded-xl text-sm font-semibold disabled:opacity-30"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                ← Prev
              </button>
              <button onClick={() => handleSceneClick(Math.min(scenes.length - 1, currentScene + 1))}
                disabled={currentScene === scenes.length - 1}
                className="text-white py-3 rounded-xl text-sm font-semibold disabled:opacity-30"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                Next →
              </button>
            </div>
          </div>

          {/* Thumbnails */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
            {scenes.map((s, index) => (
              <motion.div key={s.id} onClick={() => handleSceneClick(index)}
                className="relative rounded-xl overflow-hidden cursor-pointer"
                style={{
                  aspectRatio: "16/9",
                  border: index === currentScene ? "2px solid #a855f7" : "2px solid rgba(255,255,255,0.05)",
                  boxShadow: index === currentScene ? "0 0 16px rgba(168,85,247,0.4)" : "none",
                  opacity: index === currentScene ? 1 : 0.5,
                }}
                whileHover={{ scale: 1.05, opacity: 1 }}>
                {!imagesLoaded[index] && (
                  <div className="absolute inset-0 flex items-center justify-center z-10" style={{ background: "#0a0015" }}>
                    <div className="text-xl animate-pulse">{s.emoji}</div>
                  </div>
                )}
                <img src={s.imageUrl} alt={s.title} className="w-full h-full object-cover"
                  onLoad={() => setImagesLoaded((prev) => ({ ...prev, [index]: true }))} />
                <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.3)" }} />
                <div className="absolute bottom-1 left-2 right-2 text-xs text-white font-semibold truncate">
                  {s.emoji} {s.title}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Download + Quiz */}
          {scenes.length > 0 && (
            <motion.div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <button onClick={downloadPDF}
                className="w-full sm:w-auto text-white font-bold px-8 py-4 rounded-2xl text-base transition-all"
                style={{ background: "linear-gradient(135deg, #10b981, #059669)", boxShadow: "0 0 30px rgba(16,185,129,0.3)" }}>
                📄 Download Notes PDF
              </button>
              {quiz.length > 0 && !showQuiz && (
                <button
                  onClick={() => {
                    setShowQuiz(true);
                    setCurrentQuestion(0);
                    setSelectedAnswer(null);
                    setAnswered(false);
                    setStars(0);
                    setQuizFinished(false);
                    setQuizScore(0);
                  }}
                  className="w-full sm:w-auto text-white font-bold px-8 py-4 rounded-2xl text-base transition-all"
                  style={{ background: "linear-gradient(135deg, #f59e0b, #ef4444)", boxShadow: "0 0 30px rgba(245,158,11,0.4)" }}>
                  🧠 Take Quiz & Earn Stars!
                </button>
              )}
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Quiz Modal */}
      {showQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)" }}>
          <motion.div className="w-full max-w-xl rounded-3xl p-5 sm:p-8 max-h-screen overflow-y-auto"
            style={{ background: "#0d0028", border: "1px solid rgba(139,92,246,0.2)" }}
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            {!quizFinished ? (
              <>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-gray-400 text-sm">Question {currentQuestion + 1} of {quiz.length}</p>
                    <div className="flex gap-1 mt-1">
                      {quiz.map((_, i) => (
                        <div key={i} className="h-1 w-8 rounded-full"
                          style={{ background: i <= currentQuestion ? "linear-gradient(90deg, #a855f7, #6366f1)" : "rgba(255,255,255,0.1)" }} />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold"
                    style={{ background: "rgba(234,179,8,0.15)", color: "#fbbf24" }}>
                    ⭐ {stars}
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white mb-4">{quiz[currentQuestion].question}</h3>
                <div className="flex flex-col gap-2 mb-4">
                  {quiz[currentQuestion].options.map((option, i) => {
                    const isCorrect = i === quiz[currentQuestion].correctIndex;
                    const isSelected = selectedAnswer === i;
                    let bg = "rgba(255,255,255,0.04)";
                    let border = "rgba(255,255,255,0.1)";
                    let textColor = "white";
                    if (answered) {
                      if (isCorrect) { bg = "rgba(34,197,94,0.15)"; border = "rgba(34,197,94,0.5)"; textColor = "#4ade80"; }
                      else if (isSelected && !isCorrect) { bg = "rgba(239,68,68,0.15)"; border = "rgba(239,68,68,0.5)"; textColor = "#f87171"; }
                    } else if (isSelected) { bg = "rgba(139,92,246,0.2)"; border = "rgba(139,92,246,0.6)"; }
                    return (
                      <button key={i}
                        onClick={() => {
                          if (answered) return;
                          setSelectedAnswer(i);
                          setAnswered(true);
                          const correct = i === quiz[currentQuestion].correctIndex;
                          setStars((prev) => prev + (correct ? 1 : -1));
                          setQuizScore((prev) => prev + (correct ? 1 : 0));
                        }}
                        className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium"
                        style={{ background: bg, border: `1px solid ${border}`, color: textColor, cursor: answered ? "default" : "pointer" }}>
                        <span className="font-bold mr-2" style={{ color: answered && isCorrect ? "#4ade80" : "#c4b5fd" }}>
                          {["A", "B", "C", "D"][i]}.
                        </span>
                        {option}
                        {answered && isCorrect && " ✅"}
                        {answered && isSelected && !isCorrect && " ❌"}
                      </button>
                    );
                  })}
                </div>
                {answered && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <p className="text-center font-bold mb-3 text-sm"
                      style={{ color: selectedAnswer === quiz[currentQuestion].correctIndex ? "#4ade80" : "#f87171" }}>
                      {selectedAnswer === quiz[currentQuestion].correctIndex ? "🎉 Correct! +1 ⭐" : "❌ Wrong! -1 ⭐"}
                    </p>
                    <button
                      onClick={() => {
                        if (currentQuestion < quiz.length - 1) {
                          setCurrentQuestion((p) => p + 1);
                          setSelectedAnswer(null);
                          setAnswered(false);
                        } else {
                          setQuizFinished(true);
                        }
                      }}
                      className="w-full py-3 rounded-xl text-white font-bold text-sm"
                      style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)" }}>
                      {currentQuestion < quiz.length - 1 ? "Next Question →" : "See Results 🏆"}
                    </button>
                  </motion.div>
                )}
              </>
            ) : (
              <motion.div className="text-center" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                <div className="text-5xl mb-4">{quizScore === 5 ? "🏆" : quizScore >= 3 ? "🎉" : "💪"}</div>
                <h2 className="text-2xl font-extrabold text-white mb-2">Quiz Complete!</h2>
                <p className="text-gray-400 mb-4 text-sm">You got {quizScore} out of {quiz.length} correct</p>
                <div className="rounded-2xl p-4 mb-4"
                  style={{ background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.2)" }}>
                  <p className="text-yellow-400 text-sm mb-1">Stars Earned</p>
                  <p className="text-4xl font-extrabold text-yellow-400">{stars > 0 ? `+${stars}` : stars} ⭐</p>
                </div>
                <div className="flex gap-2 mb-4">
                  <div className="flex-1 rounded-xl p-3" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
                    <p className="text-green-400 text-xl font-bold">{quizScore}</p>
                    <p className="text-gray-400 text-xs">Correct ✅</p>
                  </div>
                  <div className="flex-1 rounded-xl p-3" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                    <p className="text-red-400 text-xl font-bold">{quiz.length - quizScore}</p>
                    <p className="text-gray-400 text-xs">Wrong ❌</p>
                  </div>
                  <div className="flex-1 rounded-xl p-3" style={{ background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.2)" }}>
                    <p className="text-yellow-400 text-xl font-bold">{totalStars}</p>
                    <p className="text-gray-400 text-xs">Total ⭐</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setShowQuiz(false); saveStars(stars); }}
                    className="flex-1 py-3 rounded-xl text-white font-bold text-sm"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    Close & Save ⭐
                  </button>
                  <button onClick={() => { setCurrentQuestion(0); setSelectedAnswer(null); setAnswered(false); setStars(0); setQuizFinished(false); setQuizScore(0); }}
                    className="flex-1 py-3 rounded-xl text-white font-bold text-sm"
                    style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)" }}>
                    Retry 🔄
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3"
          style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowHelp(false)}>
          <motion.div className="w-full max-w-lg rounded-3xl p-6 max-h-screen overflow-y-auto"
            style={{ background: "#0d0028", border: "1px solid rgba(139,92,246,0.2)" }}
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-extrabold text-white mb-5">📖 How to use Vizly</h2>
            <div className="flex flex-col gap-3">
              {[
                { step: "1", icon: "✍️", title: "Type a topic", desc: "Enter any topic you want to learn about" },
                { step: "2", icon: "🎬", title: "Generate Story", desc: "AI creates 4 cinematic scenes with images" },
                { step: "3", icon: "▶️", title: "Watch & Listen", desc: "Play the story with voice narration" },
                { step: "4", icon: "📝", title: "Read Notes", desc: "Check key points and did you know facts" },
                { step: "5", icon: "🧠", title: "Take Quiz", desc: "Test your knowledge and earn stars" },
                { step: "6", icon: "🏆", title: "Leaderboard", desc: "Compete with others and top the charts" },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: "rgba(139,92,246,0.2)", color: "#c4b5fd" }}>
                    {item.step}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{item.icon} {item.title}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setShowHelp(false)}
              className="w-full mt-5 py-3 rounded-xl text-white font-bold text-sm"
              style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)" }}>
              Got it! Let's learn 🚀
            </button>
          </motion.div>
        </div>
      )}

    </main>
  );
}
















































// "use client";

// import { useState, useEffect, useRef } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { UserButton, useUser } from "@clerk/nextjs";
// import Link from "next/link";
// import jsPDF from "jspdf";

// export default function Home() {
//   const { user } = useUser();
//   const [topic, setTopic] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [scenes, setScenes] = useState([]);
//   const [currentScene, setCurrentScene] = useState(0);
//   const [playing, setPlaying] = useState(false);
//   const [imagesLoaded, setImagesLoaded] = useState({});
//   const [muted, setMuted] = useState(false);
//   const [language, setLanguage] = useState("indian");
//   const [showHelp, setShowHelp] = useState(false);
//   const [quiz, setQuiz] = useState([]);
//   const [showQuiz, setShowQuiz] = useState(false);
//   const [currentQuestion, setCurrentQuestion] = useState(0);
//   const [selectedAnswer, setSelectedAnswer] = useState(null);
//   const [answered, setAnswered] = useState(false);
//   const [stars, setStars] = useState(0);
//   const [quizFinished, setQuizFinished] = useState(false);
//   const [quizScore, setQuizScore] = useState(0);
//   const [totalStars, setTotalStars] = useState(0);
//   const [totalQuizzes, setTotalQuizzes] = useState(0);
//   const [showMobileMenu, setShowMobileMenu] = useState(false);
//   const utteranceRef = useRef(null);

//   // Load user stats from Supabase
//   useEffect(() => {
//     if (user) {
//       fetch(`/api/user?userId=${user.id}`)
//         .then((res) => res.json())
//         .then((data) => {
//           setTotalStars(data.stars || 0);
//           setTotalQuizzes(data.quizzes || 0);
//         })
//         .catch(() => {});
//     }
//   }, [user]);

//   // Save stars to Supabase
//   const saveStars = async (earnedStars) => {
//     if (!user) return;
//     try {
//       await fetch("/api/user", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           userId: user.id,
//           name: user.fullName || user.firstName || "Anonymous",
//           stars: earnedStars,
//           quizzes: 1,
//         }),
//       });
//       // Refresh stats
//       const res = await fetch(`/api/user?userId=${user.id}`);
//       const data = await res.json();
//       setTotalStars(data.stars || 0);
//       setTotalQuizzes(data.quizzes || 0);
//     } catch (err) {
//       console.error("Error saving stars:", err);
//     }
//   };

//   const downloadPDF = () => {
//     const doc = new jsPDF();
//     const pageWidth = doc.internal.pageSize.getWidth();
//     let y = 20;
//     doc.setFillColor(13, 17, 23);
//     doc.rect(0, 0, pageWidth, 297, "F");
//     doc.setTextColor(255, 255, 255);
//     doc.setFontSize(24);
//     doc.setFont("helvetica", "bold");
//     doc.text("Vizly Notes", 20, y);
//     y += 10;
//     doc.setFontSize(14);
//     doc.setTextColor(148, 163, 184);
//     doc.text(`Topic: ${topic}`, 20, y);
//     y += 6;
//     doc.setFontSize(10);
//     doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, y);
//     y += 15;
//     doc.setDrawColor(99, 102, 241);
//     doc.setLineWidth(0.5);
//     doc.line(20, y, pageWidth - 20, y);
//     y += 10;
//     scenes.forEach((scene, index) => {
//       if (y > 240) {
//         doc.addPage();
//         doc.setFillColor(13, 17, 23);
//         doc.rect(0, 0, pageWidth, 297, "F");
//         y = 20;
//       }
//       doc.setFillColor(30, 30, 60);
//       doc.roundedRect(15, y - 5, pageWidth - 30, 10, 2, 2, "F");
//       doc.setTextColor(129, 140, 248);
//       doc.setFontSize(10);
//       doc.setFont("helvetica", "bold");
//       doc.text(`SCENE ${index + 1}`, 20, y + 2);
//       y += 12;
//       doc.setTextColor(255, 255, 255);
//       doc.setFontSize(14);
//       doc.text(`${scene.title}`, 20, y);
//       y += 8;
//       doc.setTextColor(156, 163, 175);
//       doc.setFontSize(10);
//       doc.setFont("helvetica", "normal");
//       const descLines = doc.splitTextToSize(scene.description, pageWidth - 40);
//       doc.text(descLines, 20, y);
//       y += descLines.length * 5 + 5;
//       if (scene.keyPoints && scene.keyPoints.length > 0) {
//         doc.setTextColor(129, 140, 248);
//         doc.setFontSize(10);
//         doc.setFont("helvetica", "bold");
//         doc.text("Key Points:", 20, y);
//         y += 6;
//         scene.keyPoints.forEach((point, i) => {
//           doc.setTextColor(209, 213, 219);
//           doc.setFont("helvetica", "normal");
//           doc.setFontSize(9);
//           const pointLines = doc.splitTextToSize(`${i + 1}. ${point}`, pageWidth - 50);
//           doc.text(pointLines, 25, y);
//           y += pointLines.length * 5 + 2;
//         });
//         y += 3;
//       }
//       if (scene.didYouKnow) {
//         if (y > 250) {
//           doc.addPage();
//           doc.setFillColor(13, 17, 23);
//           doc.rect(0, 0, pageWidth, 297, "F");
//           y = 20;
//         }
//         doc.setTextColor(251, 191, 36);
//         doc.setFontSize(9);
//         doc.setFont("helvetica", "bold");
//         doc.text("Did You Know?", 20, y);
//         y += 5;
//         doc.setFont("helvetica", "normal");
//         doc.setTextColor(209, 213, 219);
//         const dykLines = doc.splitTextToSize(scene.didYouKnow, pageWidth - 40);
//         doc.text(dykLines, 20, y);
//         y += dykLines.length * 5 + 8;
//       }
//       doc.setDrawColor(40, 40, 60);
//       doc.setLineWidth(0.3);
//       doc.line(20, y, pageWidth - 20, y);
//       y += 10;
//     });
//     doc.setTextColor(75, 85, 99);
//     doc.setFontSize(8);
//     doc.text("Generated by Vizly — Learn Anything Visually", 20, 285);
//     doc.save(`vizly-${topic.replace(/\s+/g, "-").toLowerCase()}.pdf`);
//   };

//   const speakScene = (scene, index) => {
//     window.speechSynthesis.cancel();
//     if (muted) return;
//     const text = `Scene ${scene.id}. ${scene.title}. ${scene.description}`;
//     const utterance = new SpeechSynthesisUtterance(text);
//     utterance.rate = 0.85;
//     utterance.pitch = 1.1;
//     utterance.volume = 1;
//     const voices = window.speechSynthesis.getVoices();
//     const voice = language === "indian"
//       ? voices.find((v) => v.name === "Microsoft Heera - English (India)") ||
//         voices.find((v) => v.name === "Microsoft Heera")
//       : voices.find((v) => v.name === "Google UK English Female") ||
//         voices.find((v) => v.name === "Microsoft Hazel - English (United Kingdom)");
//     if (voice) utterance.voice = voice;
//     utterance.onend = () => {
//       if (index < scenes.length - 1) {
//         setCurrentScene(index + 1);
//       } else {
//         setPlaying(false);
//       }
//     };
//     utteranceRef.current = utterance;
//     window.speechSynthesis.speak(utterance);
//   };

//   useEffect(() => {
//     if (playing && scenes.length > 0 && scenes[currentScene]) {
//       speakScene(scenes[currentScene], currentScene);
//     }
//   }, [playing, currentScene, language]);

//   useEffect(() => {
//     if (muted) window.speechSynthesis.cancel();
//   }, [muted]);

//   const handleSubmit = async () => {
//     if (!topic.trim()) return;
//     window.speechSynthesis.cancel();
//     setLoading(true);
//     setError("");
//     setScenes([]);
//     setCurrentScene(0);
//     setPlaying(false);
//     setImagesLoaded({});
//     setQuiz([]);
//     setStars(0);
//     setQuizFinished(false);
//     setQuizScore(0);
//     try {
//       const res = await fetch("/api/generate-scenes", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ topic }),
//       });
//       const data = await res.json();
//       if (data.error) { setError(data.error); return; }
//       setScenes(data.scenes);
//       setQuiz(data.quiz || []);

//       // Save to Supabase history
//       if (user) {
//         await fetch("/api/history", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             userId: user.id,
//             topic,
//             emoji: data.scenes[0]?.emoji || "🎬",
//             scenes: data.scenes.map((s) => ({ title: s.title, emoji: s.emoji })),
//           }),
//         });
//       }

//       data.scenes.forEach((scene, index) => {
//         const img = new window.Image();
//         img.src = scene.imageUrl;
//         img.onload = () => setImagesLoaded((prev) => ({ ...prev, [index]: true }));
//         img.onerror = () => setImagesLoaded((prev) => ({ ...prev, [index]: true }));
//       });
//     } catch (err) {
//       setError("Something went wrong. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handlePlay = () => { setCurrentScene(0); setPlaying(true); };
//   const handlePause = () => { setPlaying(false); window.speechSynthesis.cancel(); };
//   const handleSceneClick = (index) => {
//     window.speechSynthesis.cancel();
//     setCurrentScene(index);
//     setPlaying(false);
//   };

//   const scene = scenes[currentScene];

//   return (
//     <main
//       className="min-h-screen text-white flex flex-col items-center px-3 sm:px-4 pb-16"
//       style={{ background: "radial-gradient(ellipse at top, #0f1729 0%, #050810 100%)" }}
//     >
//       {/* Navbar */}
//       <div
//         className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4"
//         style={{
//           background: "rgba(5,8,16,0.9)",
//           backdropFilter: "blur(10px)",
//           borderBottom: "1px solid rgba(255,255,255,0.06)",
//         }}
//       >
//         <span className="text-lg sm:text-xl font-extrabold text-white">⚡ Vizly</span>
//         <div className="hidden md:flex items-center gap-4">
//           <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold"
//             style={{ background: "rgba(234,179,8,0.15)", border: "1px solid rgba(234,179,8,0.2)", color: "#fbbf24" }}>
//             ⭐ {totalStars} stars
//           </div>
//           <Link href="/leaderboard" className="text-gray-400 hover:text-white text-sm transition">🏆 Leaderboard</Link>
//           <Link href="/history" className="text-gray-400 hover:text-white text-sm transition">📚 History</Link>
//           <button onClick={() => setShowHelp(true)} className="text-gray-400 hover:text-white text-sm transition">📖 How to use</button>
//           <UserButton afterSignOutUrl="/sign-in" />
//         </div>
//         <div className="flex md:hidden items-center gap-3">
//           <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold"
//             style={{ background: "rgba(234,179,8,0.15)", color: "#fbbf24" }}>
//             ⭐ {totalStars}
//           </div>
//           <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="text-gray-400 hover:text-white transition p-1">
//             {showMobileMenu ? "✕" : "☰"}
//           </button>
//           <UserButton afterSignOutUrl="/sign-in" />
//         </div>
//       </div>

//       {/* Mobile Menu */}
//       {showMobileMenu && (
//         <div className="fixed top-14 left-0 right-0 z-40 md:hidden flex flex-col gap-1 p-4"
//           style={{ background: "rgba(5,8,16,0.97)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
//           <Link href="/leaderboard" onClick={() => setShowMobileMenu(false)}
//             className="text-gray-300 py-3 px-4 rounded-xl text-sm hover:bg-white/5 transition">
//             🏆 Leaderboard
//           </Link>
//           <Link href="/history" onClick={() => setShowMobileMenu(false)}
//             className="text-gray-300 py-3 px-4 rounded-xl text-sm hover:bg-white/5 transition">
//             📚 History
//           </Link>
//           <button onClick={() => { setShowHelp(true); setShowMobileMenu(false); }}
//             className="text-gray-300 py-3 px-4 rounded-xl text-sm hover:bg-white/5 transition text-left">
//             📖 How to use
//           </button>
//         </div>
//       )}

//       <div className="h-20 sm:h-24" />

//       {/* Hero */}
//       <motion.div
//         className="text-center mb-8 sm:mb-12 px-4"
//         initial={{ opacity: 0, y: -30 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.7 }}
//       >
//         <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1 text-blue-400 text-xs sm:text-sm mb-4">
//           ✨ Powered by AI
//         </div>
//         <h1 className="text-4xl sm:text-5xl font-extrabold mb-3 bg-clip-text text-transparent"
//           style={{ backgroundImage: "linear-gradient(135deg, #fff 0%, #94a3b8 100%)" }}>
//           Vizly
//         </h1>
//         <p className="text-gray-400 text-base sm:text-lg max-w-md mx-auto">
//           Type any topic and watch it transform into a cinematic visual story
//         </p>
//         {user && (
//           <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mt-4">
//             <div className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm"
//               style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
//               <span>👋</span>
//               <span className="text-gray-300">Hey, {user.firstName || "Learner"}!</span>
//             </div>
//             <div className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm"
//               style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.15)" }}>
//               <span>⭐</span>
//               <span className="text-yellow-400 font-bold">{totalStars} Stars</span>
//             </div>
//             <div className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm"
//               style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)" }}>
//               <span>🧠</span>
//               <span className="text-indigo-400 font-bold">{totalQuizzes} Quizzes</span>
//             </div>
//           </div>
//         )}
//       </motion.div>

//       {/* Input Card */}
//       <motion.div
//         className="w-full max-w-2xl rounded-2xl p-4 sm:p-6 flex flex-col gap-4"
//         style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ delay: 0.3, duration: 0.5 }}
//       >
//         <textarea
//           className="w-full text-white border rounded-xl p-3 sm:p-4 text-base sm:text-lg resize-none focus:outline-none transition"
//           style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}
//           rows={3}
//           placeholder="e.g. How does a black hole form?"
//           value={topic}
//           onChange={(e) => setTopic(e.target.value)}
//         />
//         <button
//           onClick={handleSubmit}
//           disabled={loading || !topic.trim()}
//           className="w-full text-white font-bold py-3 sm:py-4 rounded-xl text-base sm:text-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
//           style={{
//             background: loading || !topic.trim()
//               ? "rgba(99,102,241,0.3)"
//               : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
//             boxShadow: loading || !topic.trim() ? "none" : "0 0 30px rgba(99,102,241,0.4)",
//           }}
//         >
//           {loading ? (
//             <span className="flex items-center justify-center gap-3">
//               <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
//               Generating your story...
//             </span>
//           ) : "🎬 Vizly It!"}
//         </button>
//         {error && (
//           <p className="text-red-400 text-sm text-center">
//             {error.includes("retry") || error.includes("429")
//               ? "⏳ Too many requests — please wait 1 minute."
//               : `❌ ${error}`}
//           </p>
//         )}
//       </motion.div>

//       {/* Player */}
//       {scenes.length > 0 && scene && (
//         <motion.div
//           className="w-full max-w-6xl mt-8 sm:mt-16"
//           initial={{ opacity: 0, y: 40 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.8 }}
//         >
//           <div className="flex items-center gap-3 mb-4">
//             <div className="w-1 h-8 rounded-full bg-indigo-500" />
//             <h2 className="text-base sm:text-xl font-bold text-white truncate">{topic}</h2>
//           </div>

//           <div className="flex flex-col lg:flex-row gap-4">
//             {/* Image */}
//             <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden w-full"
//               style={{
//                 aspectRatio: "16/9",
//                 boxShadow: "0 0 60px rgba(99,102,241,0.2), 0 25px 50px rgba(0,0,0,0.8)",
//               }}>
//               <AnimatePresence mode="wait">
//                 <motion.div key={currentScene} className="absolute inset-0"
//                   initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
//                   transition={{ duration: 0.8 }}>
//                   {!imagesLoaded[currentScene] && (
//                     <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10"
//                       style={{ background: "#0a0f1e" }}>
//                       <div className="w-10 h-10 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
//                       <p className="text-gray-400 text-sm">Loading image...</p>
//                     </div>
//                   )}
//                   <motion.img
//                     src={scene.imageUrl} alt={scene.title}
//                     className="w-full h-full object-cover"
//                     initial={{ scale: 1 }}
//                     animate={{ scale: [1, 1.08], x: currentScene % 2 === 0 ? [0, -20] : [0, 20], y: [0, -10] }}
//                     transition={{ duration: 8, ease: "easeInOut" }}
//                     onLoad={() => setImagesLoaded((prev) => ({ ...prev, [currentScene]: true }))}
//                     onError={() => setImagesLoaded((prev) => ({ ...prev, [currentScene]: true }))}
//                   />
//                   <div className="absolute top-0 left-0 right-0 p-3 sm:p-4 flex items-center justify-between">
//                     {playing && (
//                       <div className="flex items-center gap-2 bg-black/60 backdrop-blur rounded-full px-2 sm:px-3 py-1">
//                         <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
//                         <span className="text-white text-xs tracking-widest">LIVE</span>
//                       </div>
//                     )}
//                     <div className="ml-auto bg-black/60 backdrop-blur rounded-full px-2 sm:px-3 py-1 text-white text-xs sm:text-sm">
//                       {currentScene + 1} / {scenes.length}
//                     </div>
//                   </div>
//                 </motion.div>
//               </AnimatePresence>
//             </div>

//             {/* Notes */}
//             <AnimatePresence mode="wait">
//               <motion.div key={`info-${currentScene}`}
//                 className="lg:w-96 flex flex-col gap-3"
//                 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
//                 transition={{ duration: 0.5 }}>
//                 <div className="rounded-2xl p-4 sm:p-5"
//                   style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
//                   <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold mb-3"
//                     style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8" }}>
//                     Scene {currentScene + 1} of {scenes.length}
//                   </div>
//                   <div className="flex items-start gap-3">
//                     <span className="text-2xl sm:text-3xl">{scene.emoji}</span>
//                     <h3 className="text-lg sm:text-xl font-extrabold text-white leading-tight">{scene.title}</h3>
//                   </div>
//                   <p className="text-gray-400 text-xs sm:text-sm leading-relaxed mt-3">{scene.description}</p>
//                 </div>

//                 <div className="rounded-2xl p-4 sm:p-5"
//                   style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)" }}>
//                   <div className="flex items-center gap-2 mb-3">
//                     <span className="text-sm">📌</span>
//                     <h4 className="text-indigo-400 text-xs font-bold uppercase tracking-widest">Key Points</h4>
//                   </div>
//                   <ul className="flex flex-col gap-2">
//                     {(scene.keyPoints || []).map((point, i) => (
//                       <li key={i} className="flex items-start gap-2">
//                         <span className="text-indigo-400 font-bold text-sm mt-0.5">{i + 1}.</span>
//                         <span className="text-gray-300 text-xs sm:text-sm leading-relaxed">{point}</span>
//                       </li>
//                     ))}
//                   </ul>
//                 </div>

//                 {scene.didYouKnow && (
//                   <div className="rounded-2xl p-4 sm:p-5"
//                     style={{ background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.15)" }}>
//                     <div className="flex items-center gap-2 mb-2">
//                       <span className="text-sm">💡</span>
//                       <h4 className="text-yellow-400 text-xs font-bold uppercase tracking-widest">Did You Know?</h4>
//                     </div>
//                     <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">{scene.didYouKnow}</p>
//                   </div>
//                 )}

//                 <div className="flex gap-2 px-1">
//                   {scenes.map((_, i) => (
//                     <button key={i} onClick={() => handleSceneClick(i)}
//                       className="transition-all rounded-full"
//                       style={{
//                         width: i === currentScene ? "24px" : "8px",
//                         height: "8px",
//                         background: i === currentScene
//                           ? "linear-gradient(90deg, #6366f1, #8b5cf6)"
//                           : "rgba(255,255,255,0.2)",
//                       }} />
//                   ))}
//                 </div>
//               </motion.div>
//             </AnimatePresence>
//           </div>

//           {/* Progress Bars */}
//           <div className="flex gap-1 sm:gap-2 mt-4">
//             {scenes.map((_, index) => (
//               <div key={index} className="h-1 flex-1 rounded-full overflow-hidden cursor-pointer"
//                 style={{ background: "rgba(255,255,255,0.1)" }}
//                 onClick={() => handleSceneClick(index)}>
//                 <motion.div className="h-full rounded-full"
//                   style={{ background: "linear-gradient(90deg, #6366f1, #8b5cf6)" }}
//                   animate={{ width: index < currentScene ? "100%" : index === currentScene ? "50%" : "0%" }}
//                   transition={{ duration: 0.3 }} />
//               </div>
//             ))}
//           </div>

//           {/* Controls */}
//           <div className="mt-4 sm:mt-5">
//             <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3 mb-3">
//               {!playing ? (
//                 <button onClick={handlePlay}
//                   className="col-span-2 sm:col-span-1 text-white font-bold px-6 py-3 rounded-xl transition-all text-sm sm:text-base"
//                   style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 0 20px rgba(99,102,241,0.5)" }}>
//                   ▶ Play Story
//                 </button>
//               ) : (
//                 <button onClick={handlePause}
//                   className="col-span-2 sm:col-span-1 text-white font-bold px-6 py-3 rounded-xl transition-all text-sm sm:text-base"
//                   style={{ background: "rgba(234,179,8,0.2)", border: "1px solid rgba(234,179,8,0.4)" }}>
//                   ⏸ Pause
//                 </button>
//               )}
//               <button onClick={() => { setMuted(!muted); window.speechSynthesis.cancel(); }}
//                 className="text-white py-3 rounded-xl font-semibold transition text-sm"
//                 style={{
//                   background: muted ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.05)",
//                   border: muted ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(255,255,255,0.1)",
//                 }}>
//                 {muted ? "🔇 Muted" : "🔊 Voice"}
//               </button>
//               <button
//                 onClick={() => { setLanguage(language === "indian" ? "british" : "indian"); window.speechSynthesis.cancel(); }}
//                 className="text-white py-3 rounded-xl font-semibold transition text-xs sm:text-sm"
//                 style={{
//                   background: language === "indian" ? "rgba(255,165,0,0.2)" : "rgba(99,102,241,0.2)",
//                   border: language === "indian" ? "1px solid rgba(255,165,0,0.4)" : "1px solid rgba(99,102,241,0.4)",
//                 }}>
//                 {language === "indian" ? "🇮🇳 Indian" : "🇬🇧 British"}
//               </button>
//             </div>
//             <div className="grid grid-cols-2 gap-2">
//               <button onClick={() => handleSceneClick(Math.max(0, currentScene - 1))}
//                 disabled={currentScene === 0}
//                 className="text-white py-3 rounded-xl transition disabled:opacity-30 text-sm font-semibold"
//                 style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
//                 ← Prev
//               </button>
//               <button onClick={() => handleSceneClick(Math.min(scenes.length - 1, currentScene + 1))}
//                 disabled={currentScene === scenes.length - 1}
//                 className="text-white py-3 rounded-xl transition disabled:opacity-30 text-sm font-semibold"
//                 style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
//                 Next →
//               </button>
//             </div>
//           </div>

//           {/* Thumbnails */}
//           <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-4 sm:mt-6">
//             {scenes.map((s, index) => (
//               <motion.div key={s.id} onClick={() => handleSceneClick(index)}
//                 className="relative rounded-xl overflow-hidden cursor-pointer"
//                 style={{
//                   aspectRatio: "16/9",
//                   border: index === currentScene ? "2px solid #6366f1" : "2px solid rgba(255,255,255,0.05)",
//                   boxShadow: index === currentScene ? "0 0 16px rgba(99,102,241,0.4)" : "none",
//                   opacity: index === currentScene ? 1 : 0.5,
//                 }}
//                 whileHover={{ scale: 1.05, opacity: 1 }}>
//                 {!imagesLoaded[index] && (
//                   <div className="absolute inset-0 flex items-center justify-center z-10" style={{ background: "#0a0f1e" }}>
//                     <div className="text-xl animate-pulse">{s.emoji}</div>
//                   </div>
//                 )}
//                 <img src={s.imageUrl} alt={s.title} className="w-full h-full object-cover"
//                   onLoad={() => setImagesLoaded((prev) => ({ ...prev, [index]: true }))} />
//                 <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.3)" }} />
//                 <div className="absolute bottom-1 left-2 right-2 text-xs text-white font-semibold truncate">
//                   {s.emoji} {s.title}
//                 </div>
//               </motion.div>
//             ))}
//           </div>

//           {/* Download + Quiz */}
//           {scenes.length > 0 && (
//             <motion.div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
//               initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
//               <button onClick={downloadPDF}
//                 className="w-full sm:w-auto text-white font-bold px-6 sm:px-8 py-4 rounded-2xl text-base sm:text-lg transition-all"
//                 style={{ background: "linear-gradient(135deg, #10b981, #059669)", boxShadow: "0 0 30px rgba(16,185,129,0.3)" }}>
//                 📄 Download Notes PDF
//               </button>
//               {quiz.length > 0 && !showQuiz && (
//                 <button
//                   onClick={() => {
//                     setShowQuiz(true);
//                     setCurrentQuestion(0);
//                     setSelectedAnswer(null);
//                     setAnswered(false);
//                     setStars(0);
//                     setQuizFinished(false);
//                     setQuizScore(0);
//                   }}
//                   className="w-full sm:w-auto text-white font-bold px-6 sm:px-8 py-4 rounded-2xl text-base sm:text-lg transition-all"
//                   style={{ background: "linear-gradient(135deg, #f59e0b, #ef4444)", boxShadow: "0 0 30px rgba(245,158,11,0.4)" }}>
//                   🧠 Take Quiz & Earn Stars!
//                 </button>
//               )}
//             </motion.div>
//           )}
//         </motion.div>
//       )}

//       {/* Quiz Modal */}
//       {showQuiz && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
//           style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)" }}>
//           <motion.div className="w-full max-w-xl rounded-2xl sm:rounded-3xl p-5 sm:p-8 max-h-screen overflow-y-auto"
//             style={{ background: "#0d1117", border: "1px solid rgba(255,255,255,0.1)" }}
//             initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
//             {!quizFinished ? (
//               <>
//                 <div className="flex items-center justify-between mb-5">
//                   <div>
//                     <p className="text-gray-400 text-sm">Question {currentQuestion + 1} of {quiz.length}</p>
//                     <div className="flex gap-1 mt-1">
//                       {quiz.map((_, i) => (
//                         <div key={i} className="h-1 w-6 sm:w-8 rounded-full"
//                           style={{ background: i <= currentQuestion ? "linear-gradient(90deg, #6366f1, #8b5cf6)" : "rgba(255,255,255,0.1)" }} />
//                       ))}
//                     </div>
//                   </div>
//                   <div className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold"
//                     style={{ background: "rgba(234,179,8,0.15)", color: "#fbbf24" }}>
//                     ⭐ {stars}
//                   </div>
//                 </div>
//                 <h3 className="text-base sm:text-xl font-bold text-white mb-4 leading-snug">
//                   {quiz[currentQuestion].question}
//                 </h3>
//                 <div className="flex flex-col gap-2 sm:gap-3 mb-4">
//                   {quiz[currentQuestion].options.map((option, i) => {
//                     const isCorrect = i === quiz[currentQuestion].correctIndex;
//                     const isSelected = selectedAnswer === i;
//                     let bg = "rgba(255,255,255,0.04)";
//                     let border = "rgba(255,255,255,0.1)";
//                     let textColor = "white";
//                     if (answered) {
//                       if (isCorrect) { bg = "rgba(34,197,94,0.15)"; border = "rgba(34,197,94,0.5)"; textColor = "#4ade80"; }
//                       else if (isSelected && !isCorrect) { bg = "rgba(239,68,68,0.15)"; border = "rgba(239,68,68,0.5)"; textColor = "#f87171"; }
//                     } else if (isSelected) { bg = "rgba(99,102,241,0.2)"; border = "rgba(99,102,241,0.6)"; }
//                     return (
//                       <button key={i}
//                         onClick={() => {
//                           if (answered) return;
//                           setSelectedAnswer(i);
//                           setAnswered(true);
//                           const correct = i === quiz[currentQuestion].correctIndex;
//                           setStars((prev) => prev + (correct ? 1 : -1));
//                           setQuizScore((prev) => prev + (correct ? 1 : 0));
//                         }}
//                         className="w-full text-left px-4 sm:px-5 py-3 sm:py-4 rounded-xl transition-all font-medium text-xs sm:text-sm"
//                         style={{ background: bg, border: `1px solid ${border}`, color: textColor, cursor: answered ? "default" : "pointer" }}>
//                         <span className="font-bold mr-2" style={{ color: answered && isCorrect ? "#4ade80" : "#818cf8" }}>
//                           {["A", "B", "C", "D"][i]}.
//                         </span>
//                         {option}
//                         {answered && isCorrect && " ✅"}
//                         {answered && isSelected && !isCorrect && " ❌"}
//                       </button>
//                     );
//                   })}
//                 </div>
//                 {answered && (
//                   <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
//                     <p className="text-center font-bold mb-3 text-sm"
//                       style={{ color: selectedAnswer === quiz[currentQuestion].correctIndex ? "#4ade80" : "#f87171" }}>
//                       {selectedAnswer === quiz[currentQuestion].correctIndex ? "🎉 Correct! +1 ⭐" : "❌ Wrong! -1 ⭐"}
//                     </p>
//                     <button
//                       onClick={() => {
//                         if (currentQuestion < quiz.length - 1) {
//                           setCurrentQuestion((p) => p + 1);
//                           setSelectedAnswer(null);
//                           setAnswered(false);
//                         } else {
//                           setQuizFinished(true);
//                         }
//                       }}
//                       className="w-full py-3 rounded-xl text-white font-bold transition text-sm"
//                       style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
//                       {currentQuestion < quiz.length - 1 ? "Next Question →" : "See Results 🏆"}
//                     </button>
//                   </motion.div>
//                 )}
//               </>
//             ) : (
//               <motion.div className="text-center" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
//                 <div className="text-5xl mb-4">{quizScore === 5 ? "🏆" : quizScore >= 3 ? "🎉" : "💪"}</div>
//                 <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">Quiz Complete!</h2>
//                 <p className="text-gray-400 mb-4 text-sm">You got {quizScore} out of {quiz.length} correct</p>
//                 <div className="rounded-2xl p-4 sm:p-6 mb-4"
//                   style={{ background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.2)" }}>
//                   <p className="text-yellow-400 text-sm mb-2">Stars Earned This Quiz</p>
//                   <p className="text-4xl font-extrabold text-yellow-400">{stars > 0 ? `+${stars}` : stars} ⭐</p>
//                 </div>
//                 <div className="flex gap-2 mb-4">
//                   <div className="flex-1 rounded-xl p-3"
//                     style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
//                     <p className="text-green-400 text-xl font-bold">{quizScore}</p>
//                     <p className="text-gray-400 text-xs">Correct ✅</p>
//                   </div>
//                   <div className="flex-1 rounded-xl p-3"
//                     style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
//                     <p className="text-red-400 text-xl font-bold">{quiz.length - quizScore}</p>
//                     <p className="text-gray-400 text-xs">Wrong ❌</p>
//                   </div>
//                   <div className="flex-1 rounded-xl p-3"
//                     style={{ background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.2)" }}>
//                     <p className="text-yellow-400 text-xl font-bold">{totalStars + (stars > 0 ? stars : 0)}</p>
//                     <p className="text-gray-400 text-xs">Total ⭐</p>
//                   </div>
//                 </div>
//                 <div className="flex gap-2">
//                   <button onClick={() => { setShowQuiz(false); saveStars(stars); }}
//                     className="flex-1 py-3 rounded-xl text-white font-bold transition text-sm"
//                     style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
//                     Close & Save ⭐
//                   </button>
//                   <button
//                     onClick={() => {
//                       setCurrentQuestion(0);
//                       setSelectedAnswer(null);
//                       setAnswered(false);
//                       setStars(0);
//                       setQuizFinished(false);
//                       setQuizScore(0);
//                     }}
//                     className="flex-1 py-3 rounded-xl text-white font-bold transition text-sm"
//                     style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
//                     Retry 🔄
//                   </button>
//                 </div>
//               </motion.div>
//             )}
//           </motion.div>
//         </div>
//       )}

//       {/* Help Modal */}
//       {showHelp && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
//           style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }}
//           onClick={() => setShowHelp(false)}>
//           <motion.div className="w-full max-w-lg rounded-2xl sm:rounded-3xl p-5 sm:p-8 max-h-screen overflow-y-auto"
//             style={{ background: "#0d1117", border: "1px solid rgba(255,255,255,0.1)" }}
//             initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
//             onClick={(e) => e.stopPropagation()}>
//             <h2 className="text-xl sm:text-2xl font-extrabold text-white mb-5">📖 How to use Vizly</h2>
//             <div className="flex flex-col gap-3">
//               {[
//                 { step: "1", icon: "✍️", title: "Type a topic", desc: "Enter any topic you want to learn about" },
//                 { step: "2", icon: "🎬", title: "Generate Story", desc: "AI creates 4 cinematic scenes with images" },
//                 { step: "3", icon: "▶️", title: "Watch & Listen", desc: "Play the story with voice narration" },
//                 { step: "4", icon: "📝", title: "Read Notes", desc: "Check key points and did you know facts" },
//                 { step: "5", icon: "🧠", title: "Take Quiz", desc: "Test your knowledge and earn stars" },
//                 { step: "6", icon: "🏆", title: "Leaderboard", desc: "Compete with others and top the charts" },
//               ].map((item) => (
//                 <div key={item.step} className="flex items-start gap-3">
//                   <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
//                     style={{ background: "rgba(99,102,241,0.2)", color: "#818cf8" }}>
//                     {item.step}
//                   </div>
//                   <div>
//                     <p className="text-white font-semibold text-xs sm:text-sm">{item.icon} {item.title}</p>
//                     <p className="text-gray-400 text-xs mt-0.5">{item.desc}</p>
//                   </div>
//                 </div>
//               ))}
//             </div>
//             <button onClick={() => setShowHelp(false)}
//               className="w-full mt-5 py-3 rounded-xl text-white font-bold transition text-sm"
//               style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
//               Got it! Let's learn 🚀
//             </button>
//           </motion.div>
//         </div>
//       )}
//     </main>
//   );
// }



















// "use client";

// import { useState, useEffect, useRef } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { UserButton, useUser } from "@clerk/nextjs";
// import Link from "next/link";
// import jsPDF from "jspdf";

// export default function Home() {
//   const { user } = useUser();
//   const [topic, setTopic] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [scenes, setScenes] = useState([]);
//   const [currentScene, setCurrentScene] = useState(0);
//   const [playing, setPlaying] = useState(false);
//   const [imagesLoaded, setImagesLoaded] = useState({});
//   const [muted, setMuted] = useState(false);
//   const [language, setLanguage] = useState("indian");
//   const [showHelp, setShowHelp] = useState(false);
//   const [quiz, setQuiz] = useState([]);
//   const [showQuiz, setShowQuiz] = useState(false);
//   const [currentQuestion, setCurrentQuestion] = useState(0);
//   const [selectedAnswer, setSelectedAnswer] = useState(null);
//   const [answered, setAnswered] = useState(false);
//   const [stars, setStars] = useState(0);
//   const [quizFinished, setQuizFinished] = useState(false);
//   const [quizScore, setQuizScore] = useState(0);
//   const [totalStars, setTotalStars] = useState(0);
//   const [totalQuizzes, setTotalQuizzes] = useState(0);
//   const [showMobileMenu, setShowMobileMenu] = useState(false);
//   const utteranceRef = useRef(null);

//   useEffect(() => {
//     if (user) {
//       const data = JSON.parse(localStorage.getItem("vizly_leaderboard") || "[]");
//       const me = data.find((d) => d.userId === user.id);
//       if (me) {
//         setTotalStars(me.stars);
//         setTotalQuizzes(me.quizzesTaken);
//       }
//     }
//   }, [user]);

//   const saveStars = (earnedStars) => {
//     if (!user) return;
//     const data = JSON.parse(localStorage.getItem("vizly_leaderboard") || "[]");
//     const existing = data.find((d) => d.userId === user.id);
//     if (existing) {
//       existing.stars = Math.max(0, existing.stars + earnedStars);
//       existing.quizzesTaken = (existing.quizzesTaken || 0) + 1;
//     } else {
//       data.push({
//         userId: user.id,
//         name: user.fullName || user.firstName || "Anonymous",
//         stars: Math.max(0, earnedStars),
//         quizzesTaken: 1,
//       });
//     }
//     localStorage.setItem("vizly_leaderboard", JSON.stringify(data));
//     const me = data.find((d) => d.userId === user.id);
//     setTotalStars(me.stars);
//     setTotalQuizzes(me.quizzesTaken);
//   };

//   const downloadPDF = () => {
//     const doc = new jsPDF();
//     const pageWidth = doc.internal.pageSize.getWidth();
//     let y = 20;
//     doc.setFillColor(13, 17, 23);
//     doc.rect(0, 0, pageWidth, 297, "F");
//     doc.setTextColor(255, 255, 255);
//     doc.setFontSize(24);
//     doc.setFont("helvetica", "bold");
//     doc.text("Vizly Notes", 20, y);
//     y += 10;
//     doc.setFontSize(14);
//     doc.setTextColor(148, 163, 184);
//     doc.text(`Topic: ${topic}`, 20, y);
//     y += 6;
//     doc.setFontSize(10);
//     doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, y);
//     y += 15;
//     doc.setDrawColor(99, 102, 241);
//     doc.setLineWidth(0.5);
//     doc.line(20, y, pageWidth - 20, y);
//     y += 10;
//     scenes.forEach((scene, index) => {
//       if (y > 240) {
//         doc.addPage();
//         doc.setFillColor(13, 17, 23);
//         doc.rect(0, 0, pageWidth, 297, "F");
//         y = 20;
//       }
//       doc.setFillColor(30, 30, 60);
//       doc.roundedRect(15, y - 5, pageWidth - 30, 10, 2, 2, "F");
//       doc.setTextColor(129, 140, 248);
//       doc.setFontSize(10);
//       doc.setFont("helvetica", "bold");
//       doc.text(`SCENE ${index + 1}`, 20, y + 2);
//       y += 12;
//       doc.setTextColor(255, 255, 255);
//       doc.setFontSize(14);
//       doc.text(`${scene.title}`, 20, y);
//       y += 8;
//       doc.setTextColor(156, 163, 175);
//       doc.setFontSize(10);
//       doc.setFont("helvetica", "normal");
//       const descLines = doc.splitTextToSize(scene.description, pageWidth - 40);
//       doc.text(descLines, 20, y);
//       y += descLines.length * 5 + 5;
//       if (scene.keyPoints && scene.keyPoints.length > 0) {
//         doc.setTextColor(129, 140, 248);
//         doc.setFontSize(10);
//         doc.setFont("helvetica", "bold");
//         doc.text("Key Points:", 20, y);
//         y += 6;
//         scene.keyPoints.forEach((point, i) => {
//           doc.setTextColor(209, 213, 219);
//           doc.setFont("helvetica", "normal");
//           doc.setFontSize(9);
//           const pointLines = doc.splitTextToSize(`${i + 1}. ${point}`, pageWidth - 50);
//           doc.text(pointLines, 25, y);
//           y += pointLines.length * 5 + 2;
//         });
//         y += 3;
//       }
//       if (scene.didYouKnow) {
//         if (y > 250) {
//           doc.addPage();
//           doc.setFillColor(13, 17, 23);
//           doc.rect(0, 0, pageWidth, 297, "F");
//           y = 20;
//         }
//         doc.setTextColor(251, 191, 36);
//         doc.setFontSize(9);
//         doc.setFont("helvetica", "bold");
//         doc.text("Did You Know?", 20, y);
//         y += 5;
//         doc.setFont("helvetica", "normal");
//         doc.setTextColor(209, 213, 219);
//         const dykLines = doc.splitTextToSize(scene.didYouKnow, pageWidth - 40);
//         doc.text(dykLines, 20, y);
//         y += dykLines.length * 5 + 8;
//       }
//       doc.setDrawColor(40, 40, 60);
//       doc.setLineWidth(0.3);
//       doc.line(20, y, pageWidth - 20, y);
//       y += 10;
//     });
//     doc.setTextColor(75, 85, 99);
//     doc.setFontSize(8);
//     doc.text("Generated by Vizly — Learn Anything Visually", 20, 285);
//     doc.save(`vizly-${topic.replace(/\s+/g, "-").toLowerCase()}.pdf`);
//   };

//   const speakScene = (scene, index) => {
//     window.speechSynthesis.cancel();
//     if (muted) return;
//     const text = `Scene ${scene.id}. ${scene.title}. ${scene.description}`;
//     const utterance = new SpeechSynthesisUtterance(text);
//     utterance.rate = 0.85;
//     utterance.pitch = 1.1;
//     utterance.volume = 1;
//     const voices = window.speechSynthesis.getVoices();
//     const voice = language === "indian"
//       ? voices.find((v) => v.name === "Microsoft Heera - English (India)") ||
//         voices.find((v) => v.name === "Microsoft Heera")
//       : voices.find((v) => v.name === "Google UK English Female") ||
//         voices.find((v) => v.name === "Microsoft Hazel - English (United Kingdom)");
//     if (voice) utterance.voice = voice;
//     utterance.onend = () => {
//       if (index < scenes.length - 1) {
//         setCurrentScene(index + 1);
//       } else {
//         setPlaying(false);
//       }
//     };
//     utteranceRef.current = utterance;
//     window.speechSynthesis.speak(utterance);
//   };

//   useEffect(() => {
//     if (playing && scenes.length > 0 && scenes[currentScene]) {
//       speakScene(scenes[currentScene], currentScene);
//     }
//   }, [playing, currentScene, language]);

//   useEffect(() => {
//     if (muted) window.speechSynthesis.cancel();
//   }, [muted]);

//   const handleSubmit = async () => {
//     if (!topic.trim()) return;
//     window.speechSynthesis.cancel();
//     setLoading(true);
//     setError("");
//     setScenes([]);
//     setCurrentScene(0);
//     setPlaying(false);
//     setImagesLoaded({});
//     setQuiz([]);
//     setStars(0);
//     setQuizFinished(false);
//     setQuizScore(0);
//     try {
//       const res = await fetch("/api/generate-scenes", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ topic }),
//       });
//       const data = await res.json();
//       if (data.error) { setError(data.error); return; }
//       setScenes(data.scenes);
//       setQuiz(data.quiz || []);
//       if (user) {
//         const historyItem = {
//           topic,
//           date: new Date().toISOString(),
//           emoji: data.scenes[0]?.emoji || "🎬",
//           scenes: data.scenes.map((s) => ({ title: s.title, emoji: s.emoji })),
//         };
//         const existing = JSON.parse(localStorage.getItem(`vizly_history_${user.id}`) || "[]");
//         existing.push(historyItem);
//         localStorage.setItem(`vizly_history_${user.id}`, JSON.stringify(existing.slice(-50)));
//       }
//       data.scenes.forEach((scene, index) => {
//         const img = new window.Image();
//         img.src = scene.imageUrl;
//         img.onload = () => setImagesLoaded((prev) => ({ ...prev, [index]: true }));
//         img.onerror = () => setImagesLoaded((prev) => ({ ...prev, [index]: true }));
//       });
//     } catch (err) {
//       setError("Something went wrong. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handlePlay = () => { setCurrentScene(0); setPlaying(true); };
//   const handlePause = () => { setPlaying(false); window.speechSynthesis.cancel(); };
//   const handleSceneClick = (index) => {
//     window.speechSynthesis.cancel();
//     setCurrentScene(index);
//     setPlaying(false);
//   };

//   const scene = scenes[currentScene];

//   return (
//     <main
//       className="min-h-screen text-white flex flex-col items-center px-3 sm:px-4 pb-16"
//       style={{ background: "radial-gradient(ellipse at top, #0f1729 0%, #050810 100%)" }}
//     >
//       {/* Navbar */}
//       <div
//         className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4"
//         style={{
//           background: "rgba(5,8,16,0.9)",
//           backdropFilter: "blur(10px)",
//           borderBottom: "1px solid rgba(255,255,255,0.06)",
//         }}
//       >
//         <span className="text-lg sm:text-xl font-extrabold text-white">⚡ Vizly</span>

//         {/* Desktop nav */}
//         <div className="hidden md:flex items-center gap-4">
//           <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold"
//             style={{ background: "rgba(234,179,8,0.15)", border: "1px solid rgba(234,179,8,0.2)", color: "#fbbf24" }}>
//             ⭐ {totalStars} stars
//           </div>
//           <Link href="/leaderboard" className="text-gray-400 hover:text-white text-sm transition">🏆 Leaderboard</Link>
//           <Link href="/history" className="text-gray-400 hover:text-white text-sm transition">📚 History</Link>
//           <button onClick={() => setShowHelp(true)} className="text-gray-400 hover:text-white text-sm transition">📖 How to use</button>
//           <UserButton afterSignOutUrl="/sign-in" />
//         </div>

//         {/* Mobile nav */}
//         <div className="flex md:hidden items-center gap-3">
//           <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold"
//             style={{ background: "rgba(234,179,8,0.15)", color: "#fbbf24" }}>
//             ⭐ {totalStars}
//           </div>
//           <button
//             onClick={() => setShowMobileMenu(!showMobileMenu)}
//             className="text-gray-400 hover:text-white transition p-1"
//           >
//             {showMobileMenu ? "✕" : "☰"}
//           </button>
//           <UserButton afterSignOutUrl="/sign-in" />
//         </div>
//       </div>

//       {/* Mobile Menu Dropdown */}
//       {showMobileMenu && (
//         <div
//           className="fixed top-14 left-0 right-0 z-40 md:hidden flex flex-col gap-1 p-4"
//           style={{
//             background: "rgba(5,8,16,0.97)",
//             borderBottom: "1px solid rgba(255,255,255,0.08)",
//           }}
//         >
//           <Link href="/leaderboard" onClick={() => setShowMobileMenu(false)}
//             className="text-gray-300 py-3 px-4 rounded-xl text-sm hover:bg-white/5 transition">
//             🏆 Leaderboard
//           </Link>
//           <Link href="/history" onClick={() => setShowMobileMenu(false)}
//             className="text-gray-300 py-3 px-4 rounded-xl text-sm hover:bg-white/5 transition">
//             📚 History
//           </Link>
//           <button onClick={() => { setShowHelp(true); setShowMobileMenu(false); }}
//             className="text-gray-300 py-3 px-4 rounded-xl text-sm hover:bg-white/5 transition text-left">
//             📖 How to use
//           </button>
//         </div>
//       )}

//       <div className="h-20 sm:h-24" />

//       {/* Hero */}
//       <motion.div
//         className="text-center mb-8 sm:mb-12 px-4"
//         initial={{ opacity: 0, y: -30 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.7 }}
//       >
//         <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1 text-blue-400 text-xs sm:text-sm mb-4">
//           ✨ Powered by AI
//         </div>
//         <h1
//           className="text-4xl sm:text-5xl font-extrabold mb-3 bg-clip-text text-transparent"
//           style={{ backgroundImage: "linear-gradient(135deg, #fff 0%, #94a3b8 100%)" }}
//         >
//           Vizly
//         </h1>
//         <p className="text-gray-400 text-base sm:text-lg max-w-md mx-auto">
//           Type any topic and watch it transform into a cinematic visual story
//         </p>
//         {user && (
//           <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mt-4">
//             <div className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm"
//               style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
//               <span>👋</span>
//               <span className="text-gray-300">Hey, {user.firstName || "Learner"}!</span>
//             </div>
//             <div className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm"
//               style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.15)" }}>
//               <span>⭐</span>
//               <span className="text-yellow-400 font-bold">{totalStars} Stars</span>
//             </div>
//             <div className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm"
//               style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)" }}>
//               <span>🧠</span>
//               <span className="text-indigo-400 font-bold">{totalQuizzes} Quizzes</span>
//             </div>
//           </div>
//         )}
//       </motion.div>

//       {/* Input Card */}
//       <motion.div
//         className="w-full max-w-2xl rounded-2xl p-4 sm:p-6 flex flex-col gap-4"
//         style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ delay: 0.3, duration: 0.5 }}
//       >
//         <textarea
//           className="w-full text-white border rounded-xl p-3 sm:p-4 text-base sm:text-lg resize-none focus:outline-none transition"
//           style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}
//           rows={3}
//           placeholder="e.g. How does a black hole form?"
//           value={topic}
//           onChange={(e) => setTopic(e.target.value)}
//         />
//         <button
//           onClick={handleSubmit}
//           disabled={loading || !topic.trim()}
//           className="w-full text-white font-bold py-3 sm:py-4 rounded-xl text-base sm:text-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
//           style={{
//             background: loading || !topic.trim()
//               ? "rgba(99,102,241,0.3)"
//               : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
//             boxShadow: loading || !topic.trim() ? "none" : "0 0 30px rgba(99,102,241,0.4)",
//           }}
//         >
//           {loading ? (
//             <span className="flex items-center justify-center gap-3">
//               <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
//               Generating your story...
//             </span>
//           ) : "🎬 Vizly It!"}
//         </button>
//         {error && (
//           <p className="text-red-400 text-sm text-center">
//             {error.includes("retry") || error.includes("429")
//               ? "⏳ Too many requests — please wait 1 minute."
//               : `❌ ${error}`}
//           </p>
//         )}
//       </motion.div>

//       {/* Player */}
//       {scenes.length > 0 && scene && (
//         <motion.div
//           className="w-full max-w-6xl mt-8 sm:mt-16"
//           initial={{ opacity: 0, y: 40 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.8 }}
//         >
//           <div className="flex items-center gap-3 mb-4">
//             <div className="w-1 h-8 rounded-full bg-indigo-500" />
//             <h2 className="text-base sm:text-xl font-bold text-white truncate">{topic}</h2>
//           </div>

//           {/* Image + Notes — stacked on mobile, side by side on desktop */}
//           <div className="flex flex-col lg:flex-row gap-4">

//             {/* Image */}
//             <div
//               className="relative rounded-2xl sm:rounded-3xl overflow-hidden w-full"
//               style={{
//                 aspectRatio: "16/9",
//                 boxShadow: "0 0 60px rgba(99,102,241,0.2), 0 25px 50px rgba(0,0,0,0.8)",
//               }}
//             >
//               <AnimatePresence mode="wait">
//                 <motion.div
//                   key={currentScene}
//                   className="absolute inset-0"
//                   initial={{ opacity: 0 }}
//                   animate={{ opacity: 1 }}
//                   exit={{ opacity: 0 }}
//                   transition={{ duration: 0.8 }}
//                 >
//                   {!imagesLoaded[currentScene] && (
//                     <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10"
//                       style={{ background: "#0a0f1e" }}>
//                       <div className="w-10 h-10 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
//                       <p className="text-gray-400 text-sm">Loading image...</p>
//                     </div>
//                   )}
//                   <motion.img
//                     src={scene.imageUrl}
//                     alt={scene.title}
//                     className="w-full h-full object-cover"
//                     initial={{ scale: 1 }}
//                     animate={{ scale: [1, 1.08], x: currentScene % 2 === 0 ? [0, -20] : [0, 20], y: [0, -10] }}
//                     transition={{ duration: 8, ease: "easeInOut" }}
//                     onLoad={() => setImagesLoaded((prev) => ({ ...prev, [currentScene]: true }))}
//                     onError={() => setImagesLoaded((prev) => ({ ...prev, [currentScene]: true }))}
//                   />
//                   <div className="absolute top-0 left-0 right-0 p-3 sm:p-4 flex items-center justify-between">
//                     {playing && (
//                       <div className="flex items-center gap-2 bg-black/60 backdrop-blur rounded-full px-2 sm:px-3 py-1">
//                         <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
//                         <span className="text-white text-xs tracking-widest">LIVE</span>
//                       </div>
//                     )}
//                     <div className="ml-auto bg-black/60 backdrop-blur rounded-full px-2 sm:px-3 py-1 text-white text-xs sm:text-sm">
//                       {currentScene + 1} / {scenes.length}
//                     </div>
//                   </div>
//                 </motion.div>
//               </AnimatePresence>
//             </div>

//             {/* Notes Card */}
//             <AnimatePresence mode="wait">
//               <motion.div
//                 key={`info-${currentScene}`}
//                 className="lg:w-96 flex flex-col gap-3"
//                 initial={{ opacity: 0, x: 0, y: 20 }}
//                 animate={{ opacity: 1, x: 0, y: 0 }}
//                 exit={{ opacity: 0 }}
//                 transition={{ duration: 0.5 }}
//               >
//                 <div className="rounded-2xl p-4 sm:p-5"
//                   style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
//                   <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold mb-3"
//                     style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8" }}>
//                     Scene {currentScene + 1} of {scenes.length}
//                   </div>
//                   <div className="flex items-start gap-3">
//                     <span className="text-2xl sm:text-3xl">{scene.emoji}</span>
//                     <h3 className="text-lg sm:text-xl font-extrabold text-white leading-tight">{scene.title}</h3>
//                   </div>
//                   <p className="text-gray-400 text-xs sm:text-sm leading-relaxed mt-3">{scene.description}</p>
//                 </div>

//                 <div className="rounded-2xl p-4 sm:p-5"
//                   style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)" }}>
//                   <div className="flex items-center gap-2 mb-3">
//                     <span className="text-sm">📌</span>
//                     <h4 className="text-indigo-400 text-xs font-bold uppercase tracking-widest">Key Points</h4>
//                   </div>
//                   <ul className="flex flex-col gap-2">
//                     {(scene.keyPoints || []).map((point, i) => (
//                       <li key={i} className="flex items-start gap-2">
//                         <span className="text-indigo-400 font-bold text-sm mt-0.5">{i + 1}.</span>
//                         <span className="text-gray-300 text-xs sm:text-sm leading-relaxed">{point}</span>
//                       </li>
//                     ))}
//                   </ul>
//                 </div>

//                 {scene.didYouKnow && (
//                   <div className="rounded-2xl p-4 sm:p-5"
//                     style={{ background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.15)" }}>
//                     <div className="flex items-center gap-2 mb-2">
//                       <span className="text-sm">💡</span>
//                       <h4 className="text-yellow-400 text-xs font-bold uppercase tracking-widest">Did You Know?</h4>
//                     </div>
//                     <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">{scene.didYouKnow}</p>
//                   </div>
//                 )}

//                 <div className="flex gap-2 px-1">
//                   {scenes.map((_, i) => (
//                     <button key={i} onClick={() => handleSceneClick(i)}
//                       className="transition-all rounded-full"
//                       style={{
//                         width: i === currentScene ? "24px" : "8px",
//                         height: "8px",
//                         background: i === currentScene
//                           ? "linear-gradient(90deg, #6366f1, #8b5cf6)"
//                           : "rgba(255,255,255,0.2)",
//                       }}
//                     />
//                   ))}
//                 </div>
//               </motion.div>
//             </AnimatePresence>
//           </div>

//           {/* Progress Bars */}
//           <div className="flex gap-1 sm:gap-2 mt-4">
//             {scenes.map((_, index) => (
//               <div key={index}
//                 className="h-1 flex-1 rounded-full overflow-hidden cursor-pointer"
//                 style={{ background: "rgba(255,255,255,0.1)" }}
//                 onClick={() => handleSceneClick(index)}
//               >
//                 <motion.div
//                   className="h-full rounded-full"
//                   style={{ background: "linear-gradient(90deg, #6366f1, #8b5cf6)" }}
//                   animate={{ width: index < currentScene ? "100%" : index === currentScene ? "50%" : "0%" }}
//                   transition={{ duration: 0.3 }}
//                 />
//               </div>
//             ))}
//           </div>

//           {/* Controls — responsive grid on mobile */}
//           <div className="mt-4 sm:mt-5">
//             {/* Top row — playback controls */}
//             <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3 mb-3">
//               {!playing ? (
//                 <button onClick={handlePlay}
//                   className="col-span-2 sm:col-span-1 text-white font-bold px-6 py-3 rounded-xl transition-all text-sm sm:text-base"
//                   style={{
//                     background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
//                     boxShadow: "0 0 20px rgba(99,102,241,0.5)",
//                   }}>
//                   ▶ Play Story
//                 </button>
//               ) : (
//                 <button onClick={handlePause}
//                   className="col-span-2 sm:col-span-1 text-white font-bold px-6 py-3 rounded-xl transition-all text-sm sm:text-base"
//                   style={{ background: "rgba(234,179,8,0.2)", border: "1px solid rgba(234,179,8,0.4)" }}>
//                   ⏸ Pause
//                 </button>
//               )}
//               <button
//                 onClick={() => { setMuted(!muted); window.speechSynthesis.cancel(); }}
//                 className="text-white py-3 rounded-xl font-semibold transition text-sm"
//                 style={{
//                   background: muted ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.05)",
//                   border: muted ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(255,255,255,0.1)",
//                 }}>
//                 {muted ? "🔇 Muted" : "🔊 Voice"}
//               </button>
//               <button
//                 onClick={() => { setLanguage(language === "indian" ? "british" : "indian"); window.speechSynthesis.cancel(); }}
//                 className="text-white py-3 rounded-xl font-semibold transition text-xs sm:text-sm"
//                 style={{
//                   background: language === "indian" ? "rgba(255,165,0,0.2)" : "rgba(99,102,241,0.2)",
//                   border: language === "indian" ? "1px solid rgba(255,165,0,0.4)" : "1px solid rgba(99,102,241,0.4)",
//                 }}>
//                 {language === "indian" ? "🇮🇳 Indian" : "🇬🇧 British"}
//               </button>
//             </div>

//             {/* Bottom row — prev/next */}
//             <div className="grid grid-cols-2 gap-2">
//               <button
//                 onClick={() => handleSceneClick(Math.max(0, currentScene - 1))}
//                 disabled={currentScene === 0}
//                 className="text-white py-3 rounded-xl transition disabled:opacity-30 text-sm font-semibold"
//                 style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
//                 ← Prev
//               </button>
//               <button
//                 onClick={() => handleSceneClick(Math.min(scenes.length - 1, currentScene + 1))}
//                 disabled={currentScene === scenes.length - 1}
//                 className="text-white py-3 rounded-xl transition disabled:opacity-30 text-sm font-semibold"
//                 style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
//                 Next →
//               </button>
//             </div>
//           </div>

//           {/* Thumbnails — 2 cols on mobile, 4 on desktop */}
//           <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-4 sm:mt-6">
//             {scenes.map((s, index) => (
//               <motion.div
//                 key={s.id}
//                 onClick={() => handleSceneClick(index)}
//                 className="relative rounded-xl overflow-hidden cursor-pointer"
//                 style={{
//                   aspectRatio: "16/9",
//                   border: index === currentScene ? "2px solid #6366f1" : "2px solid rgba(255,255,255,0.05)",
//                   boxShadow: index === currentScene ? "0 0 16px rgba(99,102,241,0.4)" : "none",
//                   opacity: index === currentScene ? 1 : 0.5,
//                 }}
//                 whileHover={{ scale: 1.05, opacity: 1 }}
//               >
//                 {!imagesLoaded[index] && (
//                   <div className="absolute inset-0 flex items-center justify-center z-10"
//                     style={{ background: "#0a0f1e" }}>
//                     <div className="text-xl animate-pulse">{s.emoji}</div>
//                   </div>
//                 )}
//                 <img src={s.imageUrl} alt={s.title} className="w-full h-full object-cover"
//                   onLoad={() => setImagesLoaded((prev) => ({ ...prev, [index]: true }))} />
//                 <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.3)" }} />
//                 <div className="absolute bottom-1 left-2 right-2 text-xs text-white font-semibold truncate">
//                   {s.emoji} {s.title}
//                 </div>
//               </motion.div>
//             ))}
//           </div>

//           {/* Download + Quiz Buttons */}
//           {scenes.length > 0 && (
//             <motion.div
//               className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.5 }}
//             >
//               <button
//                 onClick={downloadPDF}
//                 className="w-full sm:w-auto text-white font-bold px-6 sm:px-8 py-4 rounded-2xl text-base sm:text-lg transition-all"
//                 style={{
//                   background: "linear-gradient(135deg, #10b981, #059669)",
//                   boxShadow: "0 0 30px rgba(16,185,129,0.3)",
//                 }}>
//                 📄 Download Notes PDF
//               </button>
//               {quiz.length > 0 && !showQuiz && (
//                 <button
//                   onClick={() => {
//                     setShowQuiz(true);
//                     setCurrentQuestion(0);
//                     setSelectedAnswer(null);
//                     setAnswered(false);
//                     setStars(0);
//                     setQuizFinished(false);
//                     setQuizScore(0);
//                   }}
//                   className="w-full sm:w-auto text-white font-bold px-6 sm:px-8 py-4 rounded-2xl text-base sm:text-lg transition-all"
//                   style={{
//                     background: "linear-gradient(135deg, #f59e0b, #ef4444)",
//                     boxShadow: "0 0 30px rgba(245,158,11,0.4)",
//                   }}>
//                   🧠 Take Quiz & Earn Stars!
//                 </button>
//               )}
//             </motion.div>
//           )}
//         </motion.div>
//       )}

//       {/* Quiz Modal */}
//       {showQuiz && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
//           style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)" }}>
//           <motion.div className="w-full max-w-xl rounded-2xl sm:rounded-3xl p-5 sm:p-8 max-h-screen overflow-y-auto"
//             style={{ background: "#0d1117", border: "1px solid rgba(255,255,255,0.1)" }}
//             initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
//             {!quizFinished ? (
//               <>
//                 <div className="flex items-center justify-between mb-5 sm:mb-6">
//                   <div>
//                     <p className="text-gray-400 text-sm">Question {currentQuestion + 1} of {quiz.length}</p>
//                     <div className="flex gap-1 mt-1">
//                       {quiz.map((_, i) => (
//                         <div key={i} className="h-1 w-6 sm:w-8 rounded-full"
//                           style={{ background: i <= currentQuestion ? "linear-gradient(90deg, #6366f1, #8b5cf6)" : "rgba(255,255,255,0.1)" }} />
//                       ))}
//                     </div>
//                   </div>
//                   <div className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold"
//                     style={{ background: "rgba(234,179,8,0.15)", color: "#fbbf24" }}>
//                     ⭐ {stars}
//                   </div>
//                 </div>
//                 <h3 className="text-base sm:text-xl font-bold text-white mb-4 sm:mb-6 leading-snug">
//                   {quiz[currentQuestion].question}
//                 </h3>
//                 <div className="flex flex-col gap-2 sm:gap-3 mb-4 sm:mb-6">
//                   {quiz[currentQuestion].options.map((option, i) => {
//                     const isCorrect = i === quiz[currentQuestion].correctIndex;
//                     const isSelected = selectedAnswer === i;
//                     let bg = "rgba(255,255,255,0.04)";
//                     let border = "rgba(255,255,255,0.1)";
//                     let textColor = "white";
//                     if (answered) {
//                       if (isCorrect) { bg = "rgba(34,197,94,0.15)"; border = "rgba(34,197,94,0.5)"; textColor = "#4ade80"; }
//                       else if (isSelected && !isCorrect) { bg = "rgba(239,68,68,0.15)"; border = "rgba(239,68,68,0.5)"; textColor = "#f87171"; }
//                     } else if (isSelected) { bg = "rgba(99,102,241,0.2)"; border = "rgba(99,102,241,0.6)"; }
//                     return (
//                       <button key={i}
//                         onClick={() => {
//                           if (answered) return;
//                           setSelectedAnswer(i);
//                           setAnswered(true);
//                           const correct = i === quiz[currentQuestion].correctIndex;
//                           setStars((prev) => prev + (correct ? 1 : -1));
//                           setQuizScore((prev) => prev + (correct ? 1 : 0));
//                         }}
//                         className="w-full text-left px-4 sm:px-5 py-3 sm:py-4 rounded-xl transition-all font-medium text-xs sm:text-sm"
//                         style={{ background: bg, border: `1px solid ${border}`, color: textColor, cursor: answered ? "default" : "pointer" }}>
//                         <span className="font-bold mr-2 sm:mr-3" style={{ color: answered && isCorrect ? "#4ade80" : "#818cf8" }}>
//                           {["A", "B", "C", "D"][i]}.
//                         </span>
//                         {option}
//                         {answered && isCorrect && " ✅"}
//                         {answered && isSelected && !isCorrect && " ❌"}
//                       </button>
//                     );
//                   })}
//                 </div>
//                 {answered && (
//                   <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
//                     <p className="text-center font-bold mb-4 text-sm sm:text-base"
//                       style={{ color: selectedAnswer === quiz[currentQuestion].correctIndex ? "#4ade80" : "#f87171" }}>
//                       {selectedAnswer === quiz[currentQuestion].correctIndex ? "🎉 Correct! +1 ⭐" : "❌ Wrong! -1 ⭐"}
//                     </p>
//                     <button
//                       onClick={() => {
//                         if (currentQuestion < quiz.length - 1) {
//                           setCurrentQuestion((p) => p + 1);
//                           setSelectedAnswer(null);
//                           setAnswered(false);
//                         } else {
//                           setQuizFinished(true);
//                         }
//                       }}
//                       className="w-full py-3 rounded-xl text-white font-bold transition text-sm sm:text-base"
//                       style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
//                       {currentQuestion < quiz.length - 1 ? "Next Question →" : "See Results 🏆"}
//                     </button>
//                   </motion.div>
//                 )}
//               </>
//             ) : (
//               <motion.div className="text-center" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
//                 <div className="text-5xl sm:text-6xl mb-4">{quizScore === 5 ? "🏆" : quizScore >= 3 ? "🎉" : "💪"}</div>
//                 <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">Quiz Complete!</h2>
//                 <p className="text-gray-400 mb-5 text-sm sm:text-base">You got {quizScore} out of {quiz.length} correct</p>
//                 <div className="rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6"
//                   style={{ background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.2)" }}>
//                   <p className="text-yellow-400 text-sm mb-2">Stars Earned This Quiz</p>
//                   <p className="text-4xl sm:text-5xl font-extrabold text-yellow-400">{stars > 0 ? `+${stars}` : stars} ⭐</p>
//                 </div>
//                 <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-6">
//                   <div className="flex-1 rounded-xl p-3 sm:p-4"
//                     style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
//                     <p className="text-green-400 text-xl sm:text-2xl font-bold">{quizScore}</p>
//                     <p className="text-gray-400 text-xs">Correct ✅</p>
//                   </div>
//                   <div className="flex-1 rounded-xl p-3 sm:p-4"
//                     style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
//                     <p className="text-red-400 text-xl sm:text-2xl font-bold">{quiz.length - quizScore}</p>
//                     <p className="text-gray-400 text-xs">Wrong ❌</p>
//                   </div>
//                   <div className="flex-1 rounded-xl p-3 sm:p-4"
//                     style={{ background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.2)" }}>
//                     <p className="text-yellow-400 text-xl sm:text-2xl font-bold">{totalStars}</p>
//                     <p className="text-gray-400 text-xs">Total ⭐</p>
//                   </div>
//                 </div>
//                 <div className="flex gap-2 sm:gap-3">
//                   <button onClick={() => { setShowQuiz(false); saveStars(stars); }}
//                     className="flex-1 py-3 rounded-xl text-white font-bold transition text-sm"
//                     style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
//                     Close & Save ⭐
//                   </button>
//                   <button
//                     onClick={() => {
//                       setCurrentQuestion(0);
//                       setSelectedAnswer(null);
//                       setAnswered(false);
//                       setStars(0);
//                       setQuizFinished(false);
//                       setQuizScore(0);
//                     }}
//                     className="flex-1 py-3 rounded-xl text-white font-bold transition text-sm"
//                     style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
//                     Retry 🔄
//                   </button>
//                 </div>
//               </motion.div>
//             )}
//           </motion.div>
//         </div>
//       )}

//       {/* Help Modal */}
//       {showHelp && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
//           style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }}
//           onClick={() => setShowHelp(false)}>
//           <motion.div className="w-full max-w-lg rounded-2xl sm:rounded-3xl p-5 sm:p-8 max-h-screen overflow-y-auto"
//             style={{ background: "#0d1117", border: "1px solid rgba(255,255,255,0.1)" }}
//             initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
//             onClick={(e) => e.stopPropagation()}>
//             <h2 className="text-xl sm:text-2xl font-extrabold text-white mb-5 sm:mb-6">📖 How to use Vizly</h2>
//             <div className="flex flex-col gap-3 sm:gap-4">
//               {[
//                 { step: "1", icon: "✍️", title: "Type a topic", desc: "Enter any topic you want to learn about" },
//                 { step: "2", icon: "🎬", title: "Generate Story", desc: "AI creates 4 cinematic scenes with images" },
//                 { step: "3", icon: "▶️", title: "Watch & Listen", desc: "Play the story with voice narration" },
//                 { step: "4", icon: "📝", title: "Read Notes", desc: "Check key points and did you know facts" },
//                 { step: "5", icon: "🧠", title: "Take Quiz", desc: "Test your knowledge and earn stars" },
//                 { step: "6", icon: "🏆", title: "Leaderboard", desc: "Compete with others and top the charts" },
//               ].map((item) => (
//                 <div key={item.step} className="flex items-start gap-3 sm:gap-4">
//                   <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold shrink-0"
//                     style={{ background: "rgba(99,102,241,0.2)", color: "#818cf8" }}>
//                     {item.step}
//                   </div>
//                   <div>
//                     <p className="text-white font-semibold text-xs sm:text-sm">{item.icon} {item.title}</p>
//                     <p className="text-gray-400 text-xs mt-0.5">{item.desc}</p>
//                   </div>
//                 </div>
//               ))}
//             </div>
//             <button onClick={() => setShowHelp(false)}
//               className="w-full mt-5 sm:mt-6 py-3 rounded-xl text-white font-bold transition text-sm sm:text-base"
//               style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
//               Got it! Let's learn 🚀
//             </button>
//           </motion.div>
//         </div>
//       )}

//     </main>
//   );
// }