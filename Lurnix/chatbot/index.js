// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// In-memory conversation history (resets on server restart)
let conversationHistory = [];

app.post("/chat", async (req, res) => {
  const { message } = req.body;

  console.log("[INCOMING MESSAGE]", message);

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  // Add user message to conversation history
  conversationHistory.push({ role: "user", content: message });
  // Limit to last 10 messages
  if (conversationHistory.length > 10) {
    conversationHistory = conversationHistory.slice(-10);
  }

  try {
    // Call OpenRouter API (e.g., using gpt-3.5-turbo or similar)
    const openRouterResponse = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-3.5-turbo", // or another available model
        messages: conversationHistory
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost", // or your deployed domain
          "X-Title": "Lurnix Chatbot"
        }
      }
    );

    let reply = "";
    if (
      openRouterResponse.data &&
      openRouterResponse.data.choices &&
      openRouterResponse.data.choices.length > 0 &&
      openRouterResponse.data.choices[0].message &&
      openRouterResponse.data.choices[0].message.content
    ) {
      reply = openRouterResponse.data.choices[0].message.content;
    } else {
      reply = "Sorry, I couldn't generate a response.";
    }
    // Add bot reply to conversation history
    conversationHistory.push({ role: "assistant", content: reply });
    // Limit to last 10 messages
    if (conversationHistory.length > 10) {
      conversationHistory = conversationHistory.slice(-10);
    }
    console.log("[OUTGOING REPLY]", reply);
    res.json({ reply });
  } catch (error) {
    console.error("❌ Error:", error?.response?.data || error.message);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
