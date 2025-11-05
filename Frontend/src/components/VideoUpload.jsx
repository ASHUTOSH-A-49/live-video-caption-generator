import React, { useState } from "react";
import axios from "axios";
import socket from "../socket";
import "./VideoUpload.css";

const VideoUpload = ({ onTranscriptionStart, onError }) => {
  const [videoFile, setVideoFile] = useState(null);
  const [youtubeURL, setYoutubeURL] = useState("");
  const [lang, setLang] = useState("en");
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoFile(file);
      setFileName(file.name);
    }
  };

  const uploadFile = async () => {
    if (!videoFile) {
      onError("Please select a video file");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", videoFile);

      const res = await axios.post("http://localhost:5000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("✅ File uploaded successfully");
      onTranscriptionStart();

      // Emit to backend to start transcription
      socket.emit("start_transcription", {
        video_path: res.data.path,
        lang,
      });
      // Reset loading after emit
  setTimeout(() => setLoading(false), 500);
      // Reset after upload
      setVideoFile(null);
      setFileName("");
    } catch (error) {
      onError("Upload failed: " + error.message);
      console.error("Upload error:", error);
    } finally {
      setLoading(false);
    }
  };

const handleYouTube = () => {
  if (!youtubeURL.trim()) {
    onError("Please enter a YouTube URL");
    return;
  }
  
  setLoading(true);
  console.log("📺 Processing YouTube:", youtubeURL);
  console.log("🌍 Language:", lang);  // ADD THIS DEBUG LINE
  onTranscriptionStart();

  console.log("🟢 Emit process_youtube event");
socket.emit("process_youtube", { url: youtubeURL, lang });
// Reset loading after emit
  setTimeout(() => setLoading(false), 500);
  setYoutubeURL("");
};


  return (
    <div className="upload-section">
      <div className="upload-card">
        {/* FILE UPLOAD SECTION */}
        <div className="upload-box">
          <h3>📁 Upload Video File</h3>
          <div className="file-input-wrapper">
            <input
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              disabled={loading}
              className="file-input"
              id="file-input"
            />
            <label htmlFor="file-input" className="file-label">
              {fileName ? `Selected: ${fileName}` : "Click to choose video..."}
            </label>
          </div>
          <button
            onClick={uploadFile}
            disabled={!videoFile || loading}
            className="btn btn-primary"
          >
            {loading ? "⏳ Uploading..." : "📤 Upload & Start"}
          </button>
        </div>

        {/* DIVIDER */}
        <div className="divider">
          <span>OR</span>
        </div>

        {/* YOUTUBE SECTION */}
        <div className="youtube-box">
          <h3>📺 Process YouTube Video</h3>
          <input
            type="text"
            placeholder="Paste YouTube URL (e.g., https://youtube.com/watch?v=...)"
            value={youtubeURL}
            onChange={(e) => setYoutubeURL(e.target.value)}
            disabled={loading}
            className="url-input"
          />
          <button
            onClick={handleYouTube}
            disabled={!youtubeURL.trim() || loading}
            className="btn btn-primary"
          >
            {loading ? "⏳ Processing..." : "🎬 Process YouTube"}
          </button>
        </div>

        {/* LANGUAGE SELECTOR */}
        <div className="language-selector">
          <label htmlFor="lang-select">Select Language:</label>
          <select
            id="lang-select"
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            disabled={loading}
            className="lang-select"
          >
            <option value="en">🇬🇧 English</option>
            <option value="hi">🇮🇳 Hindi</option>
            <option value="ta">🇮🇳 Tamil</option>
            <option value="bn">🇮🇳 Bengali</option>
            <option value="te">🇮🇳 Telugu</option>
            <option value="ml">🇮🇳 Malayalam</option>
            <option value="mr">🇮🇳 Marathi</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default VideoUpload;
