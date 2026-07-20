"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";

export default function ReportIssueButton() {
  const t = useTranslations("reportIssue");
  const titleId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, submitting]);

  useEffect(() => {
    if (open) {
      setError(null);
      setSuccess(false);
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  }, [open]);

  const close = () => {
    if (submitting) return;
    setOpen(false);
    setMessage("");
    setError(null);
    setSuccess(false);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) {
      setError(t("empty"));
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      const response = await fetch("/api/report-issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ message: trimmed }),
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? t("error"));
      }

      setSuccess(true);
      setMessage("");
      window.setTimeout(() => {
        setOpen(false);
        setSuccess(false);
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="btn report-issue-btn"
        onClick={() => setOpen(true)}
      >
        {t("button")}
      </button>

      {open && (
        <div
          className="report-issue-overlay"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <div
            className="report-issue-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            <div className="report-issue-dialog-header">
              <h2 id={titleId}>{t("title")}</h2>
              <button
                type="button"
                className="report-issue-close"
                onClick={close}
                disabled={submitting}
                aria-label={t("close")}
              >
                ×
              </button>
            </div>
            <p className="report-issue-desc">{t("description")}</p>
            <form onSubmit={submit}>
              <label className="report-issue-label" htmlFor="report-issue-message">
                {t("messageLabel")}
              </label>
              <textarea
                id="report-issue-message"
                ref={textareaRef}
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t("messagePlaceholder")}
                disabled={submitting}
                maxLength={5000}
                className="report-issue-textarea"
              />
              {error && <p className="report-issue-error">{error}</p>}
              {success && <p className="report-issue-success">{t("success")}</p>}
              <div className="report-issue-actions">
                <button
                  type="button"
                  className="btn report-issue-cancel"
                  onClick={close}
                  disabled={submitting}
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  className="btn report-issue-submit"
                  disabled={submitting}
                >
                  {submitting ? t("sending") : t("submit")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
