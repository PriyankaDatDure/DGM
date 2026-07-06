"use client";

interface Props {
  label?: string;
  onClick: () => void;
  disabled?: boolean;
}

export default function DownloadIconButton({
  label = "Download PDF",
  onClick,
  disabled = false,
}: Props) {
  return (
    <button
      type="button"
      className="icon-btn download-icon-btn"
      onClick={onClick}
      title={label}
      aria-label={label}
      disabled={disabled}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
