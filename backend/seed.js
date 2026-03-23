require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("./models/User");
const Question = require("./models/Questions");
const Answer = require("./models/Answers");
const Notification = require("./models/Notification");

const MONGO_URL = process.env.MONGO_URL;

const users = [
  { username: "alex_dev", firstName: "Alex", lastName: "Johnson", email: "alex@stackit.dev", password: "password123" },
  { username: "priya_codes", firstName: "Priya", lastName: "Sharma", email: "priya@stackit.dev", password: "password123" },
  { username: "mike_ai", firstName: "Mike", lastName: "Chen", email: "mike@stackit.dev", password: "password123" },
  { username: "sara_ux", firstName: "Sara", lastName: "Williams", email: "sara@stackit.dev", password: "password123" },
];

const questionsData = [
  {
    authorIndex: 0,
    title: "Why does useEffect run twice in React 18 development mode?",
    description: "<p>I recently upgraded to React 18 and noticed my useEffect hook is running twice on mount even though I have an empty dependency array. This is causing my API calls to fire twice. Is this a bug or expected behavior? How can I handle this properly?</p>",
    tags: ["React", "useEffect", "React 18"],
    answers: [
      {
        authorIndex: 1,
        text: "<p>This is actually intentional behavior in React 18! In development mode, React intentionally mounts, unmounts, and remounts components to help you detect side effects that aren't properly cleaned up.</p><p>The fix is to return a cleanup function from your useEffect:</p><pre><code>useEffect(() => {\n  let ignore = false;\n  fetchData().then(data => {\n    if (!ignore) setData(data);\n  });\n  return () => { ignore = true; };\n}, []);</code></pre><p>This only happens in development mode — in production your effect will only run once.</p>",
        isAccepted: true,
        votes: 12,
      },
      {
        authorIndex: 2,
        text: "<p>To add to the above answer — this is called Strict Mode behavior. If you're using <code>{'<React.StrictMode>'}</code> in your index.js, that's what's causing it. You can remove StrictMode temporarily to confirm, but it's better to fix your effects to handle the double-run properly as mentioned above.</p>",
        isAccepted: false,
        votes: 5,
      },
    ],
  },
  {
    authorIndex: 1,
    title: "How do I properly manage global state in React without Redux?",
    description: "<p>My React app is getting complex and I need global state management. I've heard Redux is overkill for smaller apps. What are the best alternatives? I've looked at Context API but heard it causes unnecessary re-renders. What's the recommended approach in 2024?</p>",
    tags: ["React", "State Management", "Context API"],
    answers: [
      {
        authorIndex: 3,
        text: "<p>For most apps, <strong>Zustand</strong> is the sweet spot between simplicity and power. Here's a quick example:</p><pre><code>import create from 'zustand';\n\nconst useStore = create((set) => ({\n  user: null,\n  setUser: (user) => set({ user }),\n}));</code></pre><p>It has minimal boilerplate, great performance, and works perfectly with React hooks. No Provider needed!</p>",
        isAccepted: true,
        votes: 18,
      },
      {
        authorIndex: 0,
        text: "<p>Context API is fine for state that doesn't change often (like theme or auth). For frequently changing state, pair it with <code>useMemo</code> and <code>useCallback</code> to prevent unnecessary re-renders. But honestly, for anything beyond simple use cases, I'd go with Zustand or Jotai.</p>",
        isAccepted: false,
        votes: 7,
      },
    ],
  },
  {
    authorIndex: 2,
    title: "What's the difference between LLM fine-tuning and RAG (Retrieval Augmented Generation)?",
    description: "<p>I'm building an AI-powered app and I'm confused about when to use fine-tuning vs RAG. Both seem to help customize LLM behavior but in different ways. Can someone explain the key differences, trade-offs, and when to use each approach?</p>",
    tags: ["Python", "LLM", "RAG"],
    answers: [
      {
        authorIndex: 1,
        text: "<p><strong>Fine-tuning</strong> trains the model on your specific data, changing its weights. Best for: teaching a specific writing style, domain-specific tasks, or behavior changes. Downsides: expensive, needs lots of data, and knowledge becomes stale.</p><p><strong>RAG</strong> keeps the model the same but retrieves relevant documents at inference time. Best for: up-to-date information, large knowledge bases, transparency. Much cheaper and easier to update.</p><p>Rule of thumb: Use RAG first. Only fine-tune if RAG doesn't give good enough results.</p>",
        isAccepted: true,
        votes: 24,
      },
      {
        authorIndex: 3,
        text: "<p>Great question! I'd add that RAG is also much better for production apps because you can update your knowledge base without retraining. We use LangChain + Pinecone for our RAG pipeline and it works great. Fine-tuning with OpenAI's API is surprisingly affordable now though if you have a specific use case.</p>",
        isAccepted: false,
        votes: 9,
      },
    ],
  },
  {
    authorIndex: 3,
    title: "How to handle CORS errors when calling an API from React?",
    description: "<p>I keep getting <code>Access to XMLHttpRequest has been blocked by CORS policy</code> when my React app tries to call my Node.js backend. I've tried adding CORS headers but it still doesn't work in production. What's the correct way to fix this?</p>",
    tags: ["React", "CORS", "Node.js"],
    answers: [
      {
        authorIndex: 0,
        text: "<p>CORS errors happen because your browser blocks cross-origin requests. On the backend (Node/Express), add this:</p><pre><code>const cors = require('cors');\napp.use(cors({\n  origin: 'https://yourfrontend.com',\n  credentials: true\n}));</code></pre><p>Make sure <code>origin</code> matches your frontend URL exactly — no trailing slash! In development you can use <code>origin: 'http://localhost:3000'</code>.</p>",
        isAccepted: true,
        votes: 15,
      },
    ],
  },
  {
    authorIndex: 0,
    title: "Best practices for building a Python AI agent in 2024?",
    description: "<p>I want to build an AI agent that can browse the web, write code, and interact with APIs. I've seen LangChain and AutoGen mentioned a lot. What's the best framework and architecture to use? What pitfalls should I avoid?</p>",
    tags: ["Python", "AI Agents", "LangChain"],
    answers: [
      {
        authorIndex: 2,
        text: "<p>Having built several agents, here are my recommendations:</p><ul><li><strong>LangChain</strong> — great ecosystem, lots of integrations, but can be over-engineered for simple tasks</li><li><strong>LlamaIndex</strong> — better for RAG-heavy agents</li><li><strong>AutoGen</strong> — best for multi-agent workflows</li></ul><p>Key pitfalls: Always add retry logic, set max iterations to prevent infinite loops, log everything, and always have a human-in-the-loop for critical actions. Start simple and add complexity only when needed.</p>",
        isAccepted: true,
        votes: 21,
      },
      {
        authorIndex: 1,
        text: "<p>I'd also recommend checking out <strong>CrewAI</strong> — it's newer but has a really clean API for multi-agent systems. For web browsing specifically, Playwright works great as a tool for your agent. The key insight is treating your agent as an orchestrator that calls well-defined tools rather than trying to do everything in one prompt.</p>",
        isAccepted: false,
        votes: 11,
      },
    ],
  },
  {
    authorIndex: 2,
    title: "React performance optimization: when should I use useMemo and useCallback?",
    description: "<p>I see a lot of code that wraps everything in useMemo and useCallback, but I've also heard this can actually hurt performance if overused. When should I actually use these hooks? Are there clear rules of thumb?</p>",
    tags: ["React", "Performance", "useMemo"],
    answers: [
      {
        authorIndex: 3,
        text: "<p>Great question — this is widely misunderstood. Use <code>useMemo</code> and <code>useCallback</code> only when:</p><ol><li>The computation is genuinely expensive (e.g. filtering 10,000 items)</li><li>You're passing a function/value to a child component wrapped in <code>React.memo</code></li><li>It's a dependency of another hook that would cause infinite loops</li></ol><p>Don't use them for simple values or functions — the overhead of memoization is often worse than just recomputing. Profile first with React DevTools before optimizing!</p>",
        isAccepted: true,
        votes: 19,
      },
    ],
  },
  {
    authorIndex: 1,
    title: "How do I fine-tune an open source LLM like Llama 3 on my own dataset?",
    description: "<p>I want to fine-tune Llama 3 on my company's internal documentation to create a custom chatbot. I have about 50,000 documents. What's the best approach? Do I need expensive GPUs? What tools should I use?</p>",
    tags: ["Python", "LLM", "Fine-tuning"],
    answers: [
      {
        authorIndex: 0,
        text: "<p>You don't need expensive hardware thanks to <strong>QLoRA</strong> (Quantized LoRA) fine-tuning! Here's the stack I'd recommend:</p><ul><li><strong>Unsloth</strong> — makes Llama 3 fine-tuning 2x faster with 70% less VRAM</li><li><strong>Hugging Face TRL</strong> — for the training loop</li><li><strong>Google Colab Pro</strong> — cheap GPU access for training</li></ul><p>With 50k documents you'll want to chunk them into ~512 token pieces, create instruction-response pairs, and run 1-3 epochs. Total cost on Colab: around $10-20 for a solid fine-tune.</p>",
        isAccepted: true,
        votes: 28,
      },
      {
        authorIndex: 2,
        text: "<p>Also consider whether fine-tuning is actually what you need. For document Q&A, RAG often outperforms fine-tuning because your knowledge base can be updated without retraining. Try a RAG pipeline with your 50k docs first using LlamaIndex — you might be surprised by the quality without any fine-tuning at all.</p>",
        isAccepted: false,
        votes: 14,
      },
    ],
  },
  {
    authorIndex: 3,
    title: "CSS-in-JS vs Tailwind CSS: which should I choose for a new React project?",
    description: "<p>Starting a new React project and debating between styled-components/emotion (CSS-in-JS) and Tailwind CSS. My team has experience with both. What are the real-world trade-offs in terms of performance, DX, and maintainability?</p>",
    tags: ["React", "Tailwind CSS", "CSS"],
    answers: [
      {
        authorIndex: 1,
        text: "<p>Having used both extensively, here's my honest take:</p><p><strong>Tailwind wins for:</strong> rapid prototyping, consistent design systems, smaller bundle sizes, and great DX once you learn it. The purging means only used styles ship.</p><p><strong>CSS-in-JS wins for:</strong> dynamic styles based on props, component-scoped styles, and if your team is already experienced with it.</p><p>For new projects in 2024, I'd go Tailwind + shadcn/ui. The ecosystem has matured massively and productivity is hard to beat.</p>",
        isAccepted: true,
        votes: 16,
      },
      {
        authorIndex: 0,
        text: "<p>One thing nobody mentions: CSS-in-JS has a runtime cost since styles are injected at runtime. This matters for performance-critical apps. Tailwind is pure CSS so there's zero runtime overhead. For most projects it won't matter, but it's worth knowing.</p>",
        isAccepted: false,
        votes: 8,
      },
    ],
  },
];

async function seed() {
  await mongoose.connect(MONGO_URL);
  console.log("Connected to MongoDB");

  // Clear existing data
  await User.deleteMany({ email: { $regex: /@stackit\.dev$/ } });
  const userEmails = users.map(u => u.email);

  console.log("Cleared old seed data");

  // Create users
  const createdUsers = [];
  for (const u of users) {
    const hashed = await bcrypt.hash(u.password, 10);
    const user = await User.create({ ...u, password: hashed });
    createdUsers.push(user);
    console.log(`Created user: ${u.username}`);
  }

  // Create questions, answers
  for (const q of questionsData) {
    const question = await Question.create({
      title: q.title,
      description: q.description,
      tags: q.tags,
      author: createdUsers[q.authorIndex]._id,
    });
    console.log(`Created question: ${q.title.substring(0, 50)}...`);

    for (const a of q.answers) {
      const answer = await Answer.create({
        question: question._id,
        author: createdUsers[a.authorIndex]._id,
        text: a.text,
        isAccepted: a.isAccepted,
        votes: a.votes,
      });
      console.log(`  Created answer by ${users[a.authorIndex].username}`);
    }
  }

  console.log("\n✅ Seed complete!");
  console.log(`Created ${createdUsers.length} users and ${questionsData.length} questions`);
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});