"use client";

import type { ReactNode } from "react";

export const cardCls =
  "rounded-md border border-black/10 bg-[#faf7f0] p-4 shadow-sm scroll-mt-36 sm:p-6";
export const inputCls =
  "w-full rounded border border-black/15 bg-white px-2 py-1.5 text-sm outline-none focus:border-[#0f3a4a] focus:ring-1 focus:ring-[#0f3a4a]/30";
export const cellCls =
  "w-full rounded border border-black/15 bg-white px-1.5 py-1 text-sm outline-none focus:border-[#0f3a4a] focus:ring-1 focus:ring-[#0f3a4a]/30";

export function riskColor(r: string) {
  if (r === "High") return "border-orange-400 bg-orange-50";
  if (r === "Very High") return "border-red-500 bg-red-50 text-red-800 font-semibold";
  if (r === "Moderate") return "border-amber-300 bg-amber-50";
  if (r === "Low") return "border-emerald-300 bg-emerald-50";
  return "";
}

export function SectionTab({
  href,
  label,
  errors,
}: {
  href: string;
  label: string;
  errors: number;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-2 rounded px-2 py-2 text-white/80 transition hover:bg-white/10 hover:text-white sm:px-3"
    >
      <span className="whitespace-nowrap text-xs sm:text-sm">{label}</span>
      {errors > 0 && (
        <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
          {errors}
        </span>
      )}
    </a>
  );
}

export function SectionHeader({
  title,
  chip,
  subtitle,
}: {
  title: string;
  chip?: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-base font-semibold text-[#1f2d3a]">{title}</h2>
        {chip && (
          <span className="rounded bg-[#0f3a4a] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
            {chip}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1 text-xs text-[#5c6a76]">{subtitle}</p>}
    </div>
  );
}

export function EnhanceIconButton({
  onClick,
  disabled,
  title,
}: {
  onClick: () => void;
  disabled?: boolean;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="enhance-icon-btn"
      title={title}
      aria-label={title}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="m14.5 4 1.1 2.9L18.5 8l-2.9 1.1L14.5 12l-1.1-2.9L10.5 8l2.9-1.1L14.5 4Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
        <path
          d="m8.5 12.5 3 3M4 20l8.5-8.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
        <path
          d="m6 4 .6 1.4L8 6l-1.4.6L6 8l-.6-1.4L4 6l1.4-.6L6 4Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </svg>
    </button>
  );
}

export function FormField({
  label,
  required,
  optional,
  hint,
  errorMsg,
  warnMsg,
  children,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  hint?: string;
  errorMsg?: string;
  warnMsg?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-semibold text-[#1f2d3a]">
        {label}
        {required && <span className="text-red-600">*</span>}
        {optional && <span className="ml-1 font-normal text-[#8a95a0]">(optional)</span>}
        {hint && <span className="ml-1 font-normal text-[#8a95a0]">{hint}</span>}
      </div>
      {children}
      {errorMsg && <div className="mt-1 text-[11px] text-red-700">{errorMsg}</div>}
      {!errorMsg && warnMsg && <div className="mt-1 text-[11px] text-amber-700">{warnMsg}</div>}
    </label>
  );
}

export function FieldCell({
  errorMsg,
  warnMsg,
  children,
}: {
  errorMsg?: string;
  warnMsg?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      {children}
      {errorMsg && <div className="mt-0.5 text-[10px] leading-tight text-red-700">{errorMsg}</div>}
      {!errorMsg && warnMsg && (
        <div className="mt-0.5 text-[10px] leading-tight text-amber-700">{warnMsg}</div>
      )}
    </div>
  );
}

export function ValidateRowButton({
  onClick,
  title,
  passed = false,
}: {
  onClick: () => void;
  title?: string;
  /** Green only when every field in the row has passed validation. */
  passed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`forecast-validate-btn ${passed ? "is-pass" : "is-fail"}`}
      title={title}
      aria-label={title}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M20 6 9 17l-5-5"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

export function Th({
  children,
  req,
  className,
}: {
  children: ReactNode;
  req?: boolean;
  className?: string;
}) {
  return (
    <th
      className={`px-1 py-2 text-left text-[10px] font-medium uppercase tracking-wider text-[#5c6a76] ${className ?? ""}`}
    >
      {children}
      {req && <span className="text-red-600">*</span>}
    </th>
  );
}
