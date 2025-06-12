// Simple Community backend (no auth, no encryption, no JWT)
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Data storage (in-memory, but saved to file for persistence)
const DATA_FILE = path.join(__dirname, "community_data.json");
let data = { users: [], posts: [], comments: [] };

// Load data if exists
if (fs.existsSync(DATA_FILE)) {
  data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}

function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// --- Auth Endpoints (no JWT, password plain text) ---
app.post("/api/register", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Missing username or password" });
  if (data.users.find(u => u.username === username)) return res.status(409).json({ error: "Username taken" });
  data.users.push({ username, password });
  saveData();
  res.json({ success: true });
});

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const user = data.users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  res.json({ success: true, username });
});

// --- Community Endpoints ---
// Create post
app.post("/api/posts", (req, res) => {
  const { title, content, author, category, attachments } = req.body;
  if (!title || !content || !author) return res.status(400).json({ error: "Missing required fields" });
  const post = {
    id: Date.now(),
    title,
    content,
    author,
    category: category || "General",
    attachments: attachments || [],
    upvotes: 0,
    comments: [],
    createdAt: new Date().toISOString()
  };
  data.posts.push(post);
  saveData();
  res.json(post);
});

// Get all posts
app.get("/api/posts", (req, res) => {
  res.json(data.posts);
});

// Get single post
app.get("/api/posts/:id", (req, res) => {
  const post = data.posts.find(p => p.id == req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found" });
  res.json(post);
});

// Add comment
app.post("/api/posts/:id/comments", (req, res) => {
  const { author, content, attachments } = req.body;
  const post = data.posts.find(p => p.id == req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found" });
  const comment = {
    id: Date.now(),
    author,
    content,
    attachments: attachments || [],
    createdAt: new Date().toISOString()
  };
  post.comments.push(comment);
  saveData();
  res.json(comment);
});

// Upvote post
app.post("/api/posts/:id/upvote", (req, res) => {
  const post = data.posts.find(p => p.id == req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found" });
  post.upvotes += 1;
  saveData();
  res.json({ upvotes: post.upvotes });
});

// Search posts (by title/content/category)
app.get("/api/search", (req, res) => {
  const { q, category } = req.query;
  let results = data.posts;
  if (q) results = results.filter(p => p.title.includes(q) || p.content.includes(q));
  if (category) results = results.filter(p => p.category === category);
  res.json(results);
});

// File upload (stub, not implemented)
// app.post("/api/upload", ...)

// Start server
const port = 7001;
app.listen(port, () => {
  console.log(`Community backend running at http://localhost:${port}`);
});
