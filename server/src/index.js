import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import fetch from "node-fetch"; // needed for OpenAI proxy
import resumeRouter from "./resume.js"; // our updated resume parser

const app = express();

app.use(cors());
app.use(express.json());

const OPENAI_KEY = process.env.OPENAI_KEY;

// --- OpenAI Proxy Route ---
app.post("/api/openai", async (req, res) => {
  try {
    const body = req.body;

    const model = body.model || "gpt-4o-mini";
    const temperature = body.temperature ?? 0.3;
    const maxTokens = body.max_tokens || 500;

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: body.messages,
        max_tokens: maxTokens,
        temperature,
      }),
    });

    const data = await resp.json();

    if (!resp.ok) {
      const errorDetail = data.error ? data.error.message : "Unknown OpenAI API Error";
      return res.status(resp.status).json({
        error: `OpenAI API Error: ${errorDetail}`,
        details: data,
      });
    }

    res.json(data);
  } catch (err) {
    console.error("Server proxy error:", err);
    res.status(500).json({ error: "Internal Server Error during API call.", details: err.message });
  }
});

// --- Resume Parsing Route ---
app.use("/api/resume", resumeRouter);

// --- Start Server ---
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
