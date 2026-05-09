//chat gpt ke changes wikipidea ke 


// import { NextResponse } from "next/server";
// import Groq from "groq-sdk";

// const groq = new Groq({
//   apiKey: process.env.GROQ_API_KEY,
// });

// async function getWikipediaImage(searchQuery) {
//   try {
//     const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&format=json&origin=*`;
//     const searchRes = await fetch(searchUrl);
//     const searchData = await searchRes.json();

//     if (!searchData.query.search.length) return null;

//     const pageTitle = searchData.query.search[0].title;

//     const imageUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=pageimages&format=json&pithumbsize=1000&origin=*`;
//     const imageRes = await fetch(imageUrl);
//     const imageData = await imageRes.json();

//     const pages = imageData.query.pages;
//     const page = Object.values(pages)[0];

//     if (page.thumbnail) {
//       return page.thumbnail.source;
//     }

//     return null;
//   } catch (err) {
//     console.error("Wikipedia fetch error:", err);
//     return null;
//   }
// }

// export async function POST(request) {
//   try {
//     const { topic } = await request.json();

//     if (!topic) {
//       return NextResponse.json({ error: "Topic is required" }, { status: 400 });
//     }

//     const prompt = `
// You are a scientific visual educator. Convert the following topic into exactly 4 sequential scenes for an educational explainer video. Also generate a quiz.

// Topic: "${topic}"

// Respond ONLY with a valid JSON object. No explanation, no markdown, just raw JSON.

// Format:
// {
//   "scenes": [
//     {
//       "id": 1,
//       "title": "Scene title here",
//       "description": "2-3 sentence simple overview of this scene in English.",
//       "hindiDescription": "Same 2-3 sentence description in Hindi language.",
//       "emoji": "🌱",
//       "keyPoints": ["Key fact 1", "Key fact 2", "Key fact 3"],
//       "didYouKnow": "One surprising or interesting fact about this step.",
//       "imageSearch": "specific wikipedia search term for this exact step"
//     }
//   ],
//   "quiz": [
//     {
//       "id": 1,
//       "question": "Question text here?",
//       "options": ["Option A", "Option B", "Option C", "Option D"],
//       "correctIndex": 0
//     }
//   ]
// }

// Rules:
// - Exactly 4 scenes
// - Exactly 5 quiz questions
// - Each scene shows ONE specific step of the process
// - Quiz questions must be based on the scenes content
// - correctIndex is 0-3 (index of correct option in options array)
// - keyPoints must have exactly 3 short bullet points
// - Pick a relevant emoji for each scene
// `;

//     const completion = await groq.chat.completions.create({
//       model: "llama-3.3-70b-versatile",
//       messages: [{ role: "user", content: prompt }],
//       temperature: 0.7,
//     });

//     const raw = completion.choices[0].message.content;
//     console.log("RAW RESPONSE:", raw);

//     const cleaned = raw.replace(/```json|```/g, "").trim();
//     const parsed = JSON.parse(cleaned);

//     const scenes = parsed.scenes;
//     const quiz = parsed.quiz;

//     const imagePromises = scenes.map((scene) =>
//       getWikipediaImage(scene.imageSearch)
//     );
//     const images = await Promise.all(imagePromises);

//     const scenesWithImages = scenes.map((scene, index) => ({
//       ...scene,
//       imageUrl: images[index] ||
//         `https://image.pollinations.ai/prompt/${encodeURIComponent(scene.imageSearch)}?width=1024&height=576&model=flux&nologo=true`,
//     }));

//     return NextResponse.json({ scenes: scenesWithImages, quiz });

//   } catch (err) {
//     console.error("API ROUTE ERROR:", err.message);
//     return NextResponse.json({ error: err.message }, { status: 500 });
//   }
// }



import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function getUnsplashImage(searchQuery) {
  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=1&orientation=landscape`,
      {
        headers: {
          Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
        },
      }
    );
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      return data.results[0].urls.regular;
    }
    return null;
  } catch (err) {
    console.error("Unsplash error:", err);
    return null;
  }
}

export async function POST(request) {
  try {
    const { topic } = await request.json();

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    const prompt = `
You are a scientific visual educator. Convert the following topic into exactly 4 sequential scenes for an educational explainer video. Also generate a quiz.

Topic: "${topic}"

Respond ONLY with a valid JSON object. No explanation, no markdown, just raw JSON.

Format:
{
  "scenes": [
    {
      "id": 1,
      "title": "Scene title here",
      "description": "2-3 sentence simple overview of this scene in English.",
      "emoji": "🌱",
      "keyPoints": ["Key fact 1", "Key fact 2", "Key fact 3"],
      "didYouKnow": "One surprising or interesting fact about this step.",
      "imageSearch": "simple 2-3 word photo search term for unsplash e.g. butterfly egg leaf"
    }
  ],
  "quiz": [
    {
      "id": 1,
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0
    }
  ]
}

Rules:
- Exactly 4 scenes
- Exactly 5 quiz questions
- Each scene shows ONE specific step of the process
- imageSearch must be simple 2-3 words that would find a beautiful photo on Unsplash
- keyPoints must have exactly 3 short bullet points
- Pick a relevant emoji for each scene
`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const raw = completion.choices[0].message.content;
    console.log("RAW RESPONSE:", raw);

    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    const scenes = parsed.scenes;
    const quiz = parsed.quiz;

    // Fetch all images in parallel
    console.log("Fetching Unsplash images...");
    const imagePromises = scenes.map((scene) =>
      getUnsplashImage(scene.imageSearch)
    );
    const images = await Promise.all(imagePromises);

    const scenesWithImages = scenes.map((scene, index) => ({
      ...scene,
      imageUrl: images[index] ||
        `https://image.pollinations.ai/prompt/${encodeURIComponent(scene.imageSearch)}?width=1024&height=576&model=flux&nologo=true`,
    }));

    return NextResponse.json({ scenes: scenesWithImages, quiz });

  } catch (err) {
    console.error("API ROUTE ERROR:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}







