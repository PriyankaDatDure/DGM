"use client";

import { useMemo, useState, useTransition } from "react";
import {
  createWeatherBulletin,
  deleteWeatherBulletin,
  updateWeatherBulletin,
} from "@/actions/weather-bulletin";
import type { WeatherBulletinInput } from "@/types/actions";
import type { WeatherBulletinRow } from "@/types/database";
import { SUBMISSION_STATUSES } from "@/lib/bulletin/constants";
import { formatDateDisplay, formatDateValue, formatTimeValue } from "@/lib/format/dates";
import DataTable from "@/components/admin/DataTable";
import StatusMessage from "@/components/admin/StatusMessage";

const emptyForm = (): WeatherBulletinInput => ({
  forecast_date: "",
  publication_time: "",
  validity_period: "",
  data_sources: "",
  national_forecast_text: "",
  general_comment: "",
  submission_status: "",
  forecaster_name: "",
});

function rowToForm(row: WeatherBulletinRow): WeatherBulletinInput {
  return {
    forecast_date: formatDateValue(row.forecast_date),
    publication_time: formatTimeValue(row.publication_time),
    validity_period: row.validity_period ?? "",
    data_sources: row.data_sources ?? "",
    national_forecast_text: row.national_forecast_text ?? "",
    general_comment: row.general_comment ?? "",
    submission_status: row.submission_status ?? "",
    forecaster_name: row.forecaster_name ?? "",
  };
}

interface Props {
  initialRows: WeatherBulletinRow[];
}

export default function WeatherBulletinManager({ initialRows }: Props) {
  const [rows, setRows] = useState(initialRows);
  const [form, setForm] = useState<WeatherBulletinInput>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const columns = useMemo(
    () => [
      {
        key: "bulletin_id",
        label: "Bulletin ID",
        render: (r: WeatherBulletinRow) => r.bulletin_id.slice(0, 8) + "…",
      },
      {
        key: "forecast_date",
        label: "Forecast date",
        render: (r: WeatherBulletinRow) => formatDateDisplay(r.forecast_date),
      },
      { key: "forecaster_name", label: "Forecaster" },
      { key: "submission_status", label: "Status" },
    ],
    []
  );

  const resetForm = () => {
    setForm(emptyForm());
    setEditingId(null);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const result = editingId
        ? await updateWeatherBulletin(editingId, form)
        : await createWeatherBulletin(form);

      if (!result.success) {
        setMessage({ type: "error", text: result.error });
        return;
      }

      setRows((current) => {
        if (editingId) {
          return current.map((row) => (row.bulletin_id === editingId ? result.data : row));
        }
        return [result.data, ...current];
      });
      setMessage({ type: "success", text: result.message ?? "Saved." });
      resetForm();
    });
  };

  return (
    <div className="admin-section">
      {message && <StatusMessage type={message.type} message={message.text} />}
      <form className="panel admin-form" onSubmit={handleSubmit}>
        <h2>{editingId ? "Edit weather bulletin" : "Create weather bulletin"}</h2>
        <div className="grid">
          <div className="field">
            <label>Forecast date *</label>
            <input type="date" value={form.forecast_date} onChange={(e) => setForm({ ...form, forecast_date: e.target.value })} required />
          </div>
          <div className="field">
            <label>Publication time *</label>
            <input type="time" value={form.publication_time} onChange={(e) => setForm({ ...form, publication_time: e.target.value })} required />
          </div>
          <div className="field full">
            <label>Validity period *</label>
            <input value={form.validity_period} onChange={(e) => setForm({ ...form, validity_period: e.target.value })} required />
          </div>
          <div className="field full">
            <label>Data sources *</label>
            <textarea value={form.data_sources} onChange={(e) => setForm({ ...form, data_sources: e.target.value })} required />
          </div>
          <div className="field full">
            <label>National forecast summary *</label>
            <textarea value={form.national_forecast_text} onChange={(e) => setForm({ ...form, national_forecast_text: e.target.value })} required />
          </div>
          <div className="field full">
            <label>General comment</label>
            <textarea value={form.general_comment} onChange={(e) => setForm({ ...form, general_comment: e.target.value })} />
          </div>
          <div className="field">
            <label>Submission status *</label>
            <select value={form.submission_status} onChange={(e) => setForm({ ...form, submission_status: e.target.value })} required>
              <option value="">— Select —</option>
              {SUBMISSION_STATUSES.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Forecaster name *</label>
            <input value={form.forecaster_name} onChange={(e) => setForm({ ...form, forecaster_name: e.target.value })} required />
          </div>
        </div>
        <div className="form-actions">
          <button className="btn primary" type="submit" disabled={pending}>
            {pending ? "Saving…" : editingId ? "Update" : "Create"}
          </button>
          {editingId && (
            <button className="btn" type="button" onClick={resetForm} disabled={pending}>
              Cancel edit
            </button>
          )}
        </div>
      </form>
      <div className="panel">
        <h2>All weather bulletins</h2>
        <DataTable
          columns={columns}
          rows={rows}
          idKey="bulletin_id"
          onEdit={(row) => {
            setEditingId(row.bulletin_id);
            setForm(rowToForm(row));
          }}
          onDelete={(row) => {
            if (!window.confirm(`Delete bulletin ${row.bulletin_id.slice(0, 8)}…?`)) return;
            setDeletingId(row.bulletin_id);
            startTransition(async () => {
              const result = await deleteWeatherBulletin(row.bulletin_id);
              setDeletingId(null);
              if (!result.success) {
                setMessage({ type: "error", text: result.error });
                return;
              }
              setRows((current) => current.filter((item) => item.bulletin_id !== row.bulletin_id));
              if (editingId === row.bulletin_id) resetForm();
              setMessage({ type: "success", text: result.message ?? "Deleted." });
            });
          }}
          deletingId={deletingId}
        />
      </div>
    </div>
  );
}
