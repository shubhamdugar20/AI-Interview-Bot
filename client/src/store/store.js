// store/store.js
import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import sessionReducer from "./sessionSlice";
import candidatesReducer from "./candidateSlice";

// Enhanced persist config with better settings
const sessionPersistConfig = { 
  key: "session", 
  storage,
  // Add these for better performance
  throttle: 1000, // Throttle saves to prevent too frequent writes
  writeFailHandler: (err) => console.error('Session persist error:', err)
};

const candidatesPersistConfig = { 
  key: "candidates", 
  storage,
  throttle: 1000,
  writeFailHandler: (err) => console.error('Candidates persist error:', err)
};

export const store = configureStore({
  reducer: {
    session: persistReducer(sessionPersistConfig, sessionReducer),
    candidates: persistReducer(candidatesPersistConfig, candidatesReducer)
  },
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware({ 
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'persist/PAUSE', 'persist/FLUSH', 'persist/REGISTER']
      }
    })
});

export const persistor = persistStore(store, null, (err) => {
  if (err) {
    console.error('Persistor error:', err);
  }
});