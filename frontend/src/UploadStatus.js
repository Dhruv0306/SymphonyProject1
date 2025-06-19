// src/UploadStatus.js
import React from "react";
import "./UploadStatus.css";

const UploadStatus = ({ status }) => {
  switch (status) {
    case "uploading":
      return <p>⏫ Uploading...</p>;
    case "validating":
      return (
        <p>
          <span className="spinner" /> Validating...
        </p>
      );
    case "valid":
      return <p style={{ color: "green" }}>✅ Valid Logo</p>;
    case "invalid":
      return <p style={{ color: "red" }}>❌ No Logo Found</p>;
    case "error":
      return <p style={{ color: "orange" }}>⚠️ Upload Error</p>;
    case "retrying":
      return (
        <p style={{ color: "orange" }}>
          <span className="spinner" /> Retrying...
        </p>
      );
    case "retry_failed":
      return <p style={{ color: "red" }}>❌ Retry Failed</p>;
    default:
      return null;
  }
};

export default UploadStatus;