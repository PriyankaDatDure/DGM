"use client";

interface StatusMessageProps {
  type: "success" | "error";
  message: string;
}

export default function StatusMessage({ type, message }: StatusMessageProps) {
  return (
    <div className={`status-message ${type}`} role="status">
      {message}
    </div>
  );
}
