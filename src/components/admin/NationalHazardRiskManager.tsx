"use client";

import { useMemo, useState, useTransition } from "react";
import {
  createNationalHazardRisk,
  deleteNationalHazardRisk,
  updateNationalHazardRisk,
} from "@/actions/national-hazard-risk";
import { HAZARDS, RISK_LEVELS } from "@/lib/bulletin/constants";
import type { NationalHazardRiskInput } from "@/types/actions";
import type { NationalHazardRiskRow, WeatherBulletinOption } from "@/types/database";
import BulletinSelect from "@/components/admin/BulletinSelect";
import DataTable from "@/components/admin/DataTable";
import StatusMessage from "@/components/admin/StatusMessage";
import { formatDateValue } from "@/lib/format/dates";

const emptyForm = (): Omit<NationalHazardRiskInput, "bulletin_id"> => ({
  forecast_date: "",
  hazard_type: "",
  risk_level: "",
  areas_concerned: "",
  risk_comment: "",
  possible_recommendations: "",
});

interface Props {
  initialRows: NationalHazardRiskRow[];
  bulletinOptions: WeatherBulletinOption[];
}

export default function NationalHazardRiskManager({ initialRows, bulletinOptions }: Props) {
  const [rows, setRows] = useState(initialRows);
  const [form, setForm] = useState(emptyForm());
  const [bulletinId, setBulletinId] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  const columns = useMemo(
    () => [
      { key: "national_hazard_risk_id", label: "ID" },
      {
        key: "bulletin_id",
        label: "Bulletin ID",
        render: (r: NationalHazardRiskRow) => r.bulletin_id.slice(0, 8) + "…",
      },
      { key: "hazard_type", label: "Hazard" },
      { key: "risk_level", label: "Risk" },
    ],
    []
  );

  const set = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const resetForm = () => {
    setForm(emptyForm());
    setBulletinId("");
    setEditingId(null);
  };

  return (
    <div className="admin-section">
      {message && <StatusMessage type={message.type} message={message.text} />}
      <form
        className="panel admin-form"
        onSubmit={(event) => {
          event.preventDefault();
          setMessage(null);
          startTransition(async () => {
            const input: NationalHazardRiskInput = { bulletin_id: bulletinId, ...form };
            const result = editingId
              ? await updateNationalHazardRisk(editingId, input)
              : await createNationalHazardRisk(input);
            if (!result.success) {
              setMessage({ type: "error", text: result.error });
              return;
            }
            setRows((current) =>
              editingId
                ? current.map((row) =>
                    row.national_hazard_risk_id === editingId ? result.data : row
                  )
                : [result.data, ...current]
            );
            setMessage({ type: "success", text: result.message ?? "Saved." });
            resetForm();
          });
        }}
      >
        <h2>{editingId ? `Edit national hazard #${editingId}` : "Create national hazard risk"}</h2>
        <BulletinSelect value={bulletinId} options={bulletinOptions} onChange={setBulletinId} />
        <div className="grid">
          <div className="field">
            <label>Forecast date *</label>
            <input type="date" value={form.forecast_date} onChange={(e) => set("forecast_date", e.target.value)} required />
          </div>
          <div className="field">
            <label>Hazard type *</label>
            <select value={form.hazard_type} onChange={(e) => set("hazard_type", e.target.value)} required>
              <option value="">— Select —</option>
              {HAZARDS.map((hazard) => (
                <option key={hazard} value={hazard}>{hazard}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Risk level *</label>
            <select value={form.risk_level} onChange={(e) => set("risk_level", e.target.value)} required>
              <option value="">— Select —</option>
              {RISK_LEVELS.map((level) => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>
          <div className="field full">
            <label>Risk comment</label>
            <textarea value={form.risk_comment} onChange={(e) => set("risk_comment", e.target.value)} />
          </div>
          <div className="field full">
            <label>Possible recommendations</label>
            <textarea value={form.possible_recommendations} onChange={(e) => set("possible_recommendations", e.target.value)} />
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
        <h2>All national hazard risks</h2>
        <DataTable
          columns={columns}
          rows={rows}
          idKey="national_hazard_risk_id"
          deletingId={deletingId}
          onEdit={(row) => {
            setEditingId(row.national_hazard_risk_id);
            setBulletinId(row.bulletin_id);
            setForm({
              forecast_date: formatDateValue(row.forecast_date),
              hazard_type: row.hazard_type,
              risk_level: row.risk_level ?? "",
              areas_concerned: row.areas_concerned ?? "",
              risk_comment: row.risk_comment ?? "",
              possible_recommendations: row.possible_recommendations ?? "",
            });
          }}
          onDelete={(row) => {
            if (!window.confirm(`Delete national hazard #${row.national_hazard_risk_id}?`)) return;
            setDeletingId(row.national_hazard_risk_id);
            startTransition(async () => {
              const result = await deleteNationalHazardRisk(row.national_hazard_risk_id);
              setDeletingId(null);
              if (!result.success) {
                setMessage({ type: "error", text: result.error });
                return;
              }
              setRows((current) =>
                current.filter((item) => item.national_hazard_risk_id !== row.national_hazard_risk_id)
              );
              setMessage({ type: "success", text: result.message ?? "Deleted." });
            });
          }}
        />
      </div>
    </div>
  );
}
