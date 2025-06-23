// src/UploadStatus.js

import React from "react";
import "./UploadStatus.css";

/**
 * UploadStatus component displays the current status of a file upload process.
 * 
 * Props:
 *   - status (string): The current status of the upload. Supported values:
 *     "uploading", "validating", "valid", "invalid", "error", "retrying", "retry_failed"
 * 
 * Usage:
 *   <UploadStatus status="uploading" />
 * 
 * Production Notes:
 *   - Ensure status values are controlled and validated by the parent component.
 *   - Update UploadStatus.css to style the spinner and status messages as needed.
 *   - This component is presentational and stateless.
 */
/**
 * UploadStatus is a React functional component that displays the current status of a file upload process.
 *
 * @component
 * @param {Object} props - The component props.
 * @param {"uploading"|"validating"|"valid"|"invalid"|"error"|"retrying"|"retry_failed"|undefined} props.status
 *   The current status of the upload process. Determines which status message is displayed.
 *
 * @returns {JSX.Element|null} A paragraph element with a status message and optional spinner, or null if no status.
 *
 * @example
 * <UploadStatus status="uploading" />
 */
const UploadStatus = ({ status }) => {
  switch (status) {
    case "uploading":
      // Display uploading status
      return <p>⏫ Uploading...</p>;
    case "validating":
      // Display validating status with spinner
      return (
        <p>
          <span className="spinner" /> Validating...
        </p>
      );
    case "valid":
      // Display valid logo status
      return <p style={{ color: "green" }}>✅ Valid Logo</p>;
    case "invalid":
      // Display invalid logo status
      return <p style={{ color: "red" }}>❌ No Logo Found</p>;
    case "error":
      // Display upload error status
      return <p style={{ color: "orange" }}>⚠️ Upload Error</p>;
    case "retrying":
      // Display retrying status with spinner
      return (
        <p style={{ color: "orange" }}>
          <span className="spinner" /> Retrying...
        </p>
      );
    case "retry_failed":
      // Display retry failed status
      return <p style={{ color: "red" }}>❌ Retry Failed</p>;
    default:
      // No status to display
      return null;
  }
};

export default UploadStatus;