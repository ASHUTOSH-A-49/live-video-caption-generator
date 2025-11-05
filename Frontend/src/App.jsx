import React, { useState } from "react";
import VideoUpload from "./components/VideoUpload";
import CaptionDisplay from "./components/CaptionDisplay";
import "./App.css";

const App = () => {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState("");

  const handleTranscriptionStart = () => {
    setIsTranscribing(true);
    setError("");
  };

  const handleError = (errorMsg) => {
    setError(errorMsg);
    setIsTranscribing(false);
  };

  return (
    <div className="app">
      {/* HEADER */}
      <header className="app-header">
        <div className="header-content">
          <h1>🎙️ Deaf-Friendly Caption Generator</h1>
          <p>Real-time multilingual captions for videos and YouTube links</p>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="app-main">
        {/* ERROR MESSAGE */}
        {error && (
          <div className="error-message">
            <span>{error}</span>
            <button onClick={() => setError("")}>✕</button>
          </div>
        )}

        {/* UPLOAD SECTION */}
        <VideoUpload
          onTranscriptionStart={handleTranscriptionStart}
          onError={handleError}
        />

        {/* CAPTIONS SECTION */}
        <CaptionDisplay isTranscribing={isTranscribing} />
      </main>

      {/* FOOTER */}
      <footer className="app-footer">
        <p>🌍 Supporting multiple Indian languages for accessibility</p>
        <p>🔒 Privacy-first | 🚀 Real-time processing | ♿ Accessibility focused</p>
      </footer>
    </div>
  );
};

export default App;
