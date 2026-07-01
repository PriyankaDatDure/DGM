"use client";

interface Props {
  label?: string;
  onClick: () => void;
}

export default function EditIconButton({ label = "Edit", onClick }: Props) {
  return (
    <button
      type="button"
      className="icon-btn edit-icon-btn"
      onClick={onClick}
      title={label}
      aria-label={label}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
