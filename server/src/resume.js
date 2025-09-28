import express from "express";
import multer from "multer";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const OPENAI_KEY = process.env.OPENAI_KEY;

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const { buffer, mimetype } = req.file;
    let text = "";

    // Extract text depending on file type
    if (mimetype === "application/pdf") {
      const data = await pdfParse(buffer);
      text = data.text;
    } else if (
      mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else {
      return res.status(400).json({ error: "Unsupported file type" });
    }

    // Call OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an expert resume parser. ONLY respond with valid JSON like {\"name\":\"...\",\"email\":\"...\",\"phone\":\"...\"}. Do not include any explanation or formatting.",
          },
          { role: "user", content: `RESUME TEXT:\n\n${text}` },
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    const aiResp = await response.json();
    console.log("OpenAI response:", aiResp);

    let parsed = { name: "", email: "", phone: "" };
    const aiText = aiResp?.choices?.[0]?.message?.content || "";

    try {
      // Try parsing JSON directly
      parsed = JSON.parse(aiText);
    } catch {
      // Fallback: extract key fields using regex
      const nameMatch = aiText.match(/name[:\s]*([\w\s]+)/i);
      const emailMatch = aiText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/i);
      const phoneMatch = aiText.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/);

      parsed = {
        name: nameMatch ? nameMatch[1].trim() : "",
        email: emailMatch ? emailMatch[0] : "",
        phone: phoneMatch ? phoneMatch[0] : "",
      };
    }

    res.json(parsed);
  } catch (err) {
    console.error("Resume upload error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
