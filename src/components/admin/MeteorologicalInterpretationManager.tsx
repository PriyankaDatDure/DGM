"use client";

import { useMemo, useState, useTransition } from "react";
import {
  createMeteorologicalInterpretation,
  deleteMeteorologicalInterpretation,
  updateMeteorologicalInterpretation,
} from "@/actions/meteorological-interpretation";
import type { MeteorologicalInterpretationInput } from "@/types/actions";
import type { MeteorologicalInterpretationRow, WeatherBulletinOption } from "@/types/database";
import BulletinSelect from "@/components/admin/BulletinSelect";
import DataTable from "@/components/admin/DataTable";
import StatusMessage from "@/components/admin/StatusMessage";

const emptyForm = (): Omit<MeteorologicalInterpretationInput, "bulletin_id"> => ({
  general_situation: "",
  expected_conditions: "",
  risk_areas: "",
  expected_evolution: "",
  recommendations: "",
  additional_notes: "",
});

interface Props {
  initialRows: MeteorologicalInterpretationRow[];
  bulletinOptions: WeatherBulletinOption[];
}

export default function MeteorologicalInterpretationManager({
  initialRows,
  bulletinOptions,
}: Props) {
  const [rows, setRows] = useState(initialRows);
  const [form, setForm] = useState(emptyForm());
  const [bulletinId, setBulletinId] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  const columns = useMemo(
    () => [
      { key: "interpretation_id", label: "ID" },
      {
        key: "bulletin_id",
        label: "Bulletin ID",
        render: (row: MeteorologicalInterpretationRow) => row.bulletin_id.slice(0, 8) + "…",
      },
      {
        key: "general_situation",
        label: "General situation",
        render: (row: MeteorologicalInterpretationRow) =>
          row.general_situation?.slice(0, 60) ?? "—",
      },
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
            const input: MeteorologicalInterpretationInput = { bulletin_id: bulletinId, ...form };
            const result = editingId
              ? await updateMeteorologicalInterpretation(editingId, input)
              : await createMeteorologicalInterpretation(input);
            if (!result.success) {
              setMessage({ type: "error", text: result.error });
              return;
            }
            setRows((current) =>
              editingId
                ? current.map((row) =>
                    row.interpretation_id === editingId ? result.data : row
                  )
                : [result.data, ...current]
            );
            setMessage({ type: "success", text: result.message ?? "Saved." });
            resetForm();
          });
        }}
      >
        <h2>
          {editingId
            ? `Edit interpretation #${editingId}`
            : "Create meteorological interpretation"}
        </h2>
        <BulletinSelect value={bulletinId} options={bulletinOptions} onChange={setBulletinId} />
        <div className="grid">
          {(
            [
              ["general_situation", "General situation *"],
              ["expected_conditions", "Expected conditions"],
              ["risk_areas", "Risk areas"],
              ["expected_evolution", "Expected evolution"],
              ["recommendations", "Recommendations"],
              ["additional_notes", "Additional notes"],
            ] as const
          ).map(([key, label]) => (
            <div className="field full" key={key}>
              <label>{label}</label>
              <textarea
                value={form[key]}
                onChange={(e) => set(key, e.target.value)}
                required={key === "general_situation"}
              />
            </div>
          ))}
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
        <h2>All meteorological interpretations</h2>
        <DataTable
          columns={columns}
          rows={rows}
          idKey="interpretation_id"
          deletingId={deletingId}
          onEdit={(row) => {
            setEditingId(row.interpretation_id);
            setBulletinId(row.bulletin_id);
            setForm({
              general_situation: row.general_situation ?? "",
              expected_conditions: row.expected_conditions ?? "",
              risk_areas: row.risk_areas ?? "",
              expected_evolution: row.expected_evolution ?? "",
              recommendations: row.recommendations ?? "",
              additional_notes: row.additional_notes ?? "",
            });
          }}
          onDelete={(row) => {
            if (!window.confirm(`Delete interpretation #${row.interpretation_id}?`)) return;
            setDeletingId(row.interpretation_id);
            startTransition(async () => {
              const result = await deleteMeteorologicalInterpretation(row.interpretation_id);
              setDeletingId(null);
              if (!result.success) {
                setMessage({ type: "error", text: result.error });
                return;
              }
              setRows((current) =>
                current.filter((item) => item.interpretation_id !== row.interpretation_id)
              );
              setMessage({ type: "success", text: result.message ?? "Deleted." });
            });
          }}
        />
      </div>
    </div>
  );
}
