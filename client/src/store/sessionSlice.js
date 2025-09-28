import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  currentQuestionIndex: 0,
  questions: [],
  answers: [],
  timers: {},
  status: "idle"
};

const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    startSession(state, action) {
      state.questions = action.payload.questions;
      state.currentQuestionIndex = 0;
      state.answers = [];
      state.status = "in-progress";
      // Initialize timers for all questions
      state.timers = {};
      action.payload.questions.forEach(q => {
        state.timers[q.id] = q.timeLimit;
      });
    },
    tickTimer(state, action) {
      const qid = action.payload;
      const currentQuestion = state.questions[state.currentQuestionIndex];
      
      // Only tick the timer for the current active question
      if (currentQuestion && currentQuestion.id === qid && state.timers[qid] > 0) {
        state.timers[qid]--;
        console.log('Timer tick - question:', qid, 'remaining:', state.timers[qid]);
      }
    },
    submitAnswer(state, action) {
      state.answers.push(action.payload);
      state.currentQuestionIndex++;
      if (state.currentQuestionIndex >= state.questions.length) {
        state.status = "completed";
      }
    },
    resetTimer(state, action) {
      const qid = action.payload;
      const question = state.questions.find(q => q.id === qid);
      if (question) {
        state.timers[qid] = question.timeLimit;
      }
    }
  }
});

export const { startSession, tickTimer, submitAnswer, resetTimer } = sessionSlice.actions;
export default sessionSlice.reducer;