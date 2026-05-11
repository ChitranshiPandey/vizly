# ⚡ Vizly — Learn Anything Visually

![Vizly Banner](https://vizly-one.vercel.app/og-image.png)

> Turn any topic into a cinematic visual story with AI magic ✨

🌐 **Live Demo:** [vizly-one.vercel.app](https://vizly-one.vercel.app)

---

## 🎬 What is Vizly?

Vizly is an AI-powered visual learning app that transforms any topic into beautiful cinematic scenes with voice narration, detailed notes, and interactive quizzes.

Just type any topic → Watch it come to life!

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🎬 **AI Scene Generation** | Converts any topic into 4 cinematic scenes |
| 🖼️ **HD Images** | Beautiful Unsplash photos for each scene |
| 🔊 **Voice Narration** | Indian & British English voice options |
| 📝 **Smart Notes** | Key points + Did You Know facts |
| 🧠 **Interactive Quiz** | 5 MCQ questions per topic |
| ⭐ **Star System** | Earn stars for correct answers |
| 🏆 **Leaderboard** | Global rankings powered by Supabase |
| 📚 **History** | All your past topics saved |
| 📄 **PDF Export** | Download detailed notes as PDF |
| 📱 **Mobile Ready** | Fully responsive design |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, React, Tailwind CSS |
| **Animations** | Framer Motion |
| **AI Scenes** | Groq (Llama 3.3 70B) |
| **Images** | Unsplash API |
| **Auth** | Clerk |
| **Database** | Supabase (PostgreSQL) |
| **Deployment** | Vercel |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ChitranshiPandey/vizly.git
cd vizly
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file:
```env
GROQ_API_KEY=your_groq_key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret
UNSPLASH_ACCESS_KEY=your_unsplash_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

---

## 📸 Screenshots

### Home Page
![Home Page](screenshots/home.png)

### Scene Player
![Scene Player](screenshots/player.png)

### Scene Process
![Process](screenshots/process.png)

### Quiz
![Quiz](screenshots/quiz.png)

### Leaderboard
![Leaderboard](screenshots/leaderboard.png)

---

## 🌟 How It Works

User types topic
↓
Groq AI generates 4 scenes + 5 quiz questions
↓
Unsplash fetches HD images for each scene
↓
Cinematic player with Ken Burns effect
↓
Voice narration synced with slides
↓
Quiz with star rewards
↓
Results saved to Supabase leaderboard