import axios from "axios";

export async function callOpenAI(messages, model = "gpt-4o-mini") {
  const resp = await axios.post("https://ai-interview-bot-eo27.onrender.com/api/openai", { messages, model });
  return resp.data;
}
