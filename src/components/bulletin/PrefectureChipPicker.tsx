"use client";

interface Props {
  options: readonly string[];
  selected: string[];
  onToggle: (prefecture: string) => void;
}

export default function PrefectureChipPicker({ options, selected, onToggle }: Props) {
  return (
    <div className="multiselect">
      {options.map((prefecture) => (
        <span
          key={prefecture}
          className={`chip ${selected.includes(prefecture) ? "selected" : ""}`}
          onClick={() => onToggle(prefecture)}
        >
          {prefecture}
        </span>
      ))}
    </div>
  );
}
