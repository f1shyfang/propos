"use client";

import { useState } from "react";
import { Icon } from "@/components/shared/icon";

export type FeedbackStatus = "interested" | "need_more_info" | "not_for_me";

export function FeedbackButtonGroup({
  initialStatus,
  initialComment,
  onFeedback
}: {
  initialStatus: FeedbackStatus | null;
  initialComment: string | null;
  onFeedback: (status: FeedbackStatus, comment: string) => void;
}) {
  const [status, setStatus] = useState<FeedbackStatus | null>(initialStatus);
  const [comment, setComment] = useState(initialComment ?? "");

  const handleStatusClick = (newStatus: FeedbackStatus) => {
    setStatus(newStatus);
    onFeedback(newStatus, comment);
  };

  const handleCommentBlur = () => {
    if (status) {
      onFeedback(status, comment);
    }
  };

  return (
    <div style={{ background: "var(--pg-bg)", padding: 24, borderRadius: 12, border: "1px solid var(--pg-border)" }}>
      <h3 style={{ margin: "0 0 16px", fontSize: 16 }}>Your Feedback</h3>
      
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <button 
          onClick={() => handleStatusClick("interested")}
          style={{
            flex: "1 1 0", minWidth: 120, padding: "12px 16px", borderRadius: 8,
            display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
            border: status === "interested" ? "2px solid #2e7d32" : "1px solid var(--pg-border)",
            background: status === "interested" ? "#e8f5e9" : "var(--pg-surface)",
            color: status === "interested" ? "#2e7d32" : "var(--pg-text)",
            cursor: "pointer", fontWeight: 600, transition: "all 0.2s"
          }}
        >
          <Icon name="thumbs-up" size={24} />
          Interested
        </button>
        
        <button 
          onClick={() => handleStatusClick("need_more_info")}
          style={{
            flex: "1 1 0", minWidth: 120, padding: "12px 16px", borderRadius: 8,
            display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
            border: status === "need_more_info" ? "2px solid #ed6c02" : "1px solid var(--pg-border)",
            background: status === "need_more_info" ? "#fff3e0" : "var(--pg-surface)",
            color: status === "need_more_info" ? "#ed6c02" : "var(--pg-text)",
            cursor: "pointer", fontWeight: 600, transition: "all 0.2s"
          }}
        >
          <Icon name="help-circle" size={24} />
          Need More Info
        </button>
        
        <button 
          onClick={() => handleStatusClick("not_for_me")}
          style={{
            flex: "1 1 0", minWidth: 120, padding: "12px 16px", borderRadius: 8,
            display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
            border: status === "not_for_me" ? "2px solid #d32f2f" : "1px solid var(--pg-border)",
            background: status === "not_for_me" ? "#ffebee" : "var(--pg-surface)",
            color: status === "not_for_me" ? "#d32f2f" : "var(--pg-text)",
            cursor: "pointer", fontWeight: 600, transition: "all 0.2s"
          }}
        >
          <Icon name="x" size={24} />
          Not For Me
        </button>
      </div>

      <textarea 
        placeholder="Add a note for your agent..."
        className="pg-input"
        style={{ width: "100%", minHeight: 80, resize: "vertical" }}
        value={comment}
        onChange={e => setComment(e.target.value)}
        onBlur={handleCommentBlur}
      />
    </div>
  );
}
