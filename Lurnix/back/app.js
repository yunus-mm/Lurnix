const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const port = 7002;

// In-memory conversation history (resets on server restart)
let conversationHistory = [];

// ✅ Endpoint to process AI request
app.post("/api/voice", async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Text is required" });
  }

  // Add user message to conversation history (OpenRouter expects {role, content})
  conversationHistory.push({ role: "user", content: text });
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
          "X-Title": "Lurnix Voice Chat"
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
    // Add assistant reply to conversation history
    conversationHistory.push({ role: "assistant", content: reply });
    if (conversationHistory.length > 10) {
      conversationHistory = conversationHistory.slice(-10);
    }
    console.log("[OUTGOING REPLY]", reply);
    res.json({ response: reply });
  } catch (error) {
    console.error("Error communicating with OpenRouter API:", error?.response?.data || error.message);
    res.status(500).json({ error: "Error processing your request with OpenRouter AI" });
  }
});

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
