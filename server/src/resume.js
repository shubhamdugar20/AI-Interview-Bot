import express from "express";
import multer from "multer";
import pdfParse from "pdf-parse/lib/pdf-parse.js";

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

    // 📝 Extract text from PDF/DOCX
    if (mimetype === "application/pdf") {
      if (!buffer) throw new Error("Missing PDF buffer");
      const data = await pdfParse(buffer);
      text = data.text;
    } else if (
      mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      if (!buffer) throw new Error("Missing DOCX buffer");
      const result = await mammoth.extractRawText({ arrayBuffer: buffer });
      text = result.value;
    } else {
      return res.status(400).json({ error: "Unsupported file type" });
    }

    //  Call OpenAI to extract details
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
              "You are an expert resume parser. ONLY respond with valid JSON like {\"name\":\"...\",\"email\":\"...\",\"phone\":\"...\"}.",
          },
          { role: "user", content: `Extract candidate details from:\n\n${text}` },
        ],
        max_tokens: 500,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errMsg = await response.text();
      throw new Error(`OpenAI API error: ${errMsg}`);
    }

    const aiResp = await response.json();
    const aiText = aiResp?.choices?.[0]?.message?.content?.trim() || "";

    let parsed = { name: "", email: "", phone: "" };

    try {
      const cleanText = aiText.replace(/```json|```/g, "");
      parsed = JSON.parse(cleanText);
    } catch {
      // Regex fallback
      const nameMatch = aiText.match(/name[:\s]*([\w\s]+)/i);
      const emailMatch = aiText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/i);
      const phoneMatch = aiText.match(
        /(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/
      );

      parsed = {
        name: nameMatch ? nameMatch[1].trim() : "",
        email: emailMatch ? emailMatch[0].trim() : "",
        phone: phoneMatch ? phoneMatch[0].trim() : "",
      };
    }

    res.json(parsed);
  } catch (err) {
    console.error("Resume upload error:", err.message);
    res.status(500).json({ error: "Resume parsing failed" });
  }
});

export default router;
