import React, { useState, useEffect, useRef } from "react";
import socket from "../socket";
import "./CaptionDisplay.css";

const CaptionDisplay = ({ isTranscribing }) => {
  const [captions, setCaptions] = useState([]);
  const [confidence, setConfidence] = useState(0);
  const [currentCaption, setCurrentCaption] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);
  const captionsBoxRef = useRef(null);

  useEffect(() => {
    // Receive caption from backend
    socket.on("caption", (data) => {
      setCurrentCaption(data.text);
      setConfidence((data.confidence * 100) || 0);
      setCaptions((prev) => [...prev, data]);
      setIsLoading(false);
    });

    // Transcription completed
    socket.on("done", (data) => {
      console.log("✅ Transcription completed!");
      setIsLoading(false);
      if (data.full_transcript) {
        console.log("Full transcript:", data.full_transcript);
      }
    });

    // Error handling
    socket.on("error", (data) => {
      console.error("❌ Backend error:", data.message);
      setIsLoading(false);
      setCurrentCaption("Error: " + data.message);
    });

    setIsLoading(isTranscribing);

    return () => {
      socket.off("caption");
      socket.off("done");
      socket.off("error");
    };
  }, [isTranscribing]);

  // Auto-scroll to latest caption
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [captions]);

  const downloadTranscript = () => {
    const fullText = captions.map((c) => c.text).join("\n");
    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/plain;charset=utf-8," + encodeURIComponent(fullText)
    );
    element.setAttribute("download", "captions.txt");
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const clearCaptions = () => {
    setCaptions([]);
    setCurrentCaption("");
    setConfidence(0);
  };

  return (
    <div className="caption-display-section">
      <div className="caption-card">
        {/* HEADER */}
        <div className="caption-header">
          <h2>🎙️ Live Captions</h2>
          <div className="header-controls">
            {captions.length > 0 && (
              <>
                <button
                  onClick={downloadTranscript}
                  className="btn-small btn-download"
                  title="Download transcript as text file"
                >
                  📥 Download
                </button>
                <button
                  onClick={clearCaptions}
                  className="btn-small btn-clear"
                  title="Clear all captions"
                >
                  🗑️ Clear
                </button>
              </>
            )}
          </div>
        </div>

        {/* CURRENT CAPTION DISPLAY */}
        {(isLoading || currentCaption) && (
          <div className="current-caption-box">
            <div className={`current-caption ${isLoading ? "loading" : ""}`}>
              {isLoading && !currentCaption ? (
                <>
                  <div className="spinner"></div>
                  <p>⏳ Waiting for captions...</p>
                </>
              ) : (
                <>
                  <p className="caption-text">{currentCaption}</p>
                  {confidence > 0 && (
                    <div className="confidence-bar">
                      <div
                        className="confidence-fill"
                        style={{ width: `${confidence}%` }}
                      ></div>
                      <span className="confidence-text">
                        Confidence: {confidence.toFixed(0)}%
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* CAPTIONS HISTORY */}
        <div className="captions-header">
          <h3>📜 Caption History ({captions.length})</h3>
        </div>

        <div className="captions-box" ref={captionsBoxRef}>
          {captions.length === 0 ? (
            <div className="empty-state">
              <p>😊 No captions yet</p>
              <p>Upload a video or paste YouTube link to get started!</p>
            </div>
          ) : (
            captions.map((cap, i) => (
              <div key={i} className="caption-item">
                <span className="caption-index">{i + 1}</span>
                <div className="caption-content">
                  <p className="caption-simplified">{cap.text}</p>
                  {cap.original && cap.original !== cap.text && (
                    <p className="caption-original">Original: {cap.original}</p>
                  )}
                  {cap.confidence && (
                    <span className="caption-confidence">
                      ✓ {(cap.confidence * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={scrollRef}></div>
        </div>
      </div>
    </div>
  );
};

export default CaptionDisplay;
