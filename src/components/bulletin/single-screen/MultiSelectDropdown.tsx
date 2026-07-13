"use client";

import { useEffect, useRef } from "react";

interface Props {
  open: boolean;
  onToggle: () => void;
  value: string[];
  onChange: (value: string[]) => void;
  options: readonly string[];
  needed?: boolean;
  disabled?: boolean;
  placeholder?: string;
  disabledPlaceholder?: string;
  errorMsg?: string;
  warnMsg?: string;
}

export default function MultiSelectDropdown({
  open,
  onToggle,
  value,
  onChange,
  options,
  needed,
  disabled,
  placeholder = "Select…",
  disabledPlaceholder,
  errorMsg,
  warnMsg,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      const root = rootRef.current;
      if (root && !root.contains(event.target as Node)) {
        onToggle();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open, onToggle]);

  const toggle = (option: string) =>
    onChange(value.includes(option) ? value.filter((v) => v !== option) : [...value, option]);

  const display =
    value.length === 0
      ? disabled
        ? (disabledPlaceholder ?? placeholder)
        : placeholder
      : value.join(", ");

  return (
    <div ref={rootRef} className={`relative ${disabled ? "opacity-50" : ""}`}>
      <button
        type="button"
        onClick={disabled ? undefined : onToggle}
        disabled={disabled}
        className={`ms-dropdown-trigger${needed ? " needed" : ""}`}
      >
        <span className={`ms-dropdown-value${value.length === 0 ? " placeholder" : ""}`}>
          {display}
        </span>
        <span className="ms-dropdown-caret" aria-hidden="true">
          ▾
        </span>
      </button>
      {errorMsg && <div className="mt-1 text-[11px] text-red-700">{errorMsg}</div>}
      {!errorMsg && warnMsg && <div className="mt-1 text-[11px] text-amber-700">{warnMsg}</div>}
      {open && !disabled && (
        <div className="ms-dropdown-panel">
          <div className="ms-dropdown-actions">
            <button type="button" onClick={() => onChange([...options])}>
              Select all
            </button>
            <button type="button" onClick={() => onChange([])}>
              Clear
            </button>
          </div>
          <div className="ms-dropdown-options">
            {options.map((option) => (
              <label key={option} className="ms-dropdown-option">
                <input
                  type="checkbox"
                  checked={value.includes(option)}
                  onChange={() => toggle(option)}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
