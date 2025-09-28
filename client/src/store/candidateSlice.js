import { createSlice } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from "uuid";

const initialState = { list: [] };

const candidateSlice = createSlice({
  name: "candidates",
  initialState,
  reducers: {
    addCandidate(state, action) {
      state.list.push({ id: uuidv4(), ...action.payload, transcript: [] });
    },
    addTranscriptEntry(state, action) {
      const { id, entry } = action.payload;
      const candidate = state.list.find(c => c.id === id);
      if (candidate) candidate.transcript.push(entry);
    },
    setFinalScore(state, action) {
      const { id, score, summary } = action.payload;
      const candidate = state.list.find(c => c.id === id);
      if (candidate) { candidate.finalScore = score; candidate.summary = summary; }
    }
  }
});

export const { addCandidate, addTranscriptEntry, setFinalScore } = candidateSlice.actions;
export default candidateSlice.reducer;
