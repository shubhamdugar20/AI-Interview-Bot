import axios from "axios";

export async function callOpenAI(messages, model = "gpt-4o-mini") {
  const resp = await axios.post("http://localhost:3001/api/openai", { messages, model });
  return resp.data;
}
