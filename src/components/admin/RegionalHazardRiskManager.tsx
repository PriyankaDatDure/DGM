"use client";

import { useMemo, useState, useTransition } from "react";
import {
  createRegionalHazardRisk,
  deleteRegionalHazardRisk,
  updateRegionalHazardRisk,
} from "@/actions/regional-hazard-risk";
import {
  HAZARDS,
  REGIONS,
  RISK_LEVELS,
  regionDisplayLabel,
} from "@/lib/bulletin/constants";
import type { RegionCode } from "@/lib/bulletin/types";
import type { RegionalHazardRiskInput } from "@/types/actions";
import type { RegionalHazardRiskRow, WeatherBulletinOption } from "@/types/database";
import BulletinSelect from "@/components/admin/BulletinSelect";
import DataTable from "@/components/admin/DataTable";
import StatusMessage from "@/components/admin/StatusMessage";
import PrefectureChipPicker from "@/components/bulletin/PrefectureChipPicker";
import { prefecturesForRegion, isRegionCode } from "@/lib/bulletin/region-prefectures";

type FormState = Omit<
  RegionalHazardRiskInput,
  "bulletin_id" | "affected_prefectures" | "affected_subprefectures"
> & {
  selectedPrefectures: string[];
};

const emptyForm = (): FormState => ({
  region_code: "",
  hazard_type: "",
  risk_level: "",
  selectedPrefectures: [],
  risk_comment: "",
  possible_recommendations: "",
});

interface Props {
  initialRows: RegionalHazardRiskRow[];
  bulletinOptions: WeatherBulletinOption[];
}

export default function RegionalHazardRiskManager({ initialRows, bulletinOptions }: Props) {
  const [rows, setRows] = useState(initialRows);
  const [form, setForm] = useState(emptyForm());
  const [bulletinId, setBulletinId] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  const regionPrefectures = useMemo(
    () =>
      form.region_code && isRegionCode(form.region_code)
        ? prefecturesForRegion(form.region_code)
        : [],
    [form.region_code]
  );

  const columns = useMemo(
    () => [
      { key: "regional_hazard_risk_id", label: "ID" },
      {
        key: "bulletin_id",
        label: "Bulletin ID",
        render: (r: RegionalHazardRiskRow) => r.bulletin_id.slice(0, 8) + "…",
      },
      {
        key: "region_code",
        label: "Region",
        render: (r: RegionalHazardRiskRow) =>
          isRegionCode(r.region_code) ? regionDisplayLabel(r.region_code) : r.region_code,
      },
      { key: "hazard_type", label: "Hazard" },
      { key: "risk_level", label: "Risk" },
    ],
    []
  );

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "region_code" && typeof value === "string") {
        next.selectedPrefectures = [];
      }
      return next;
    });

  const togglePrefecture = (prefecture: string) => {
    setForm((current) => {
      const exists = current.selectedPrefectures.includes(prefecture);
      const selectedPrefectures = exists
        ? current.selectedPrefectures.filter((p) => p !== prefecture)
        : [...current.selectedPrefectures, prefecture];
      return { ...current, selectedPrefectures };
    });
  };

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
            const input: RegionalHazardRiskInput = {
              bulletin_id: bulletinId,
              region_code: form.region_code,
              hazard_type: form.hazard_type,
              risk_level: form.risk_level,
              affected_prefectures: form.selectedPrefectures.join(", "),
              affected_subprefectures: "",
              risk_comment: form.risk_comment,
              possible_recommendations: form.possible_recommendations,
            };
            const result = editingId
              ? await updateRegionalHazardRisk(editingId, input)
              : await createRegionalHazardRisk(input);
            if (!result.success) {
              setMessage({ type: "error", text: result.error });
              return;
            }
            setRows((current) =>
              editingId
                ? current.map((row) =>
                    row.regional_hazard_risk_id === editingId ? result.data : row
                  )
                : [result.data, ...current]
            );
            setMessage({ type: "success", text: result.message ?? "Saved." });
            resetForm();
          });
        }}
      >
        <h2>{editingId ? `Edit regional hazard #${editingId}` : "Create regional hazard risk"}</h2>
        <BulletinSelect value={bulletinId} options={bulletinOptions} onChange={setBulletinId} />
        <div className="grid">
          <div className="field">
            <label>Region *</label>
            <select
              value={form.region_code}
              onChange={(e) => set("region_code", e.target.value)}
              required
            >
              <option value="">— Select —</option>
              {REGIONS.map((region) => (
                <option key={region} value={region}>
                  {regionDisplayLabel(region)}
                </option>
              ))}
            </select>
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
            <label>Affected prefectures</label>
            {form.region_code ? (
              <PrefectureChipPicker
                options={regionPrefectures}
                selected={form.selectedPrefectures}
                onToggle={togglePrefecture}
              />
            ) : (
              <p className="hint">Select a region to choose prefectures.</p>
            )}
          </div>
          <div className="field full">
            <label>Risk comment</label>
            <textarea value={form.risk_comment} onChange={(e) => set("risk_comment", e.target.value)} />
          </div>
          <div className="field full">
            <label>Possible recommendations</label>
            <textarea
              value={form.possible_recommendations}
              onChange={(e) => set("possible_recommendations", e.target.value)}
            />
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
        <h2>All regional hazard risks</h2>
        <DataTable
          columns={columns}
          rows={rows}
          idKey="regional_hazard_risk_id"
          deletingId={deletingId}
          onEdit={(row) => {
            setEditingId(row.regional_hazard_risk_id);
            setBulletinId(row.bulletin_id);
            setForm({
              region_code: row.region_code,
              hazard_type: row.hazard_type,
              risk_level: row.risk_level ?? "",
              selectedPrefectures: row.affected_prefectures ?? [],
              risk_comment: row.risk_comment ?? "",
              possible_recommendations: row.possible_recommendations ?? "",
            });
          }}
          onDelete={(row) => {
            if (!window.confirm(`Delete regional hazard #${row.regional_hazard_risk_id}?`)) return;
            setDeletingId(row.regional_hazard_risk_id);
            startTransition(async () => {
              const result = await deleteRegionalHazardRisk(row.regional_hazard_risk_id);
              setDeletingId(null);
              if (!result.success) {
                setMessage({ type: "error", text: result.error });
                return;
              }
              setRows((current) =>
                current.filter((item) => item.regional_hazard_risk_id !== row.regional_hazard_risk_id)
              );
              setMessage({ type: "success", text: result.message ?? "Deleted." });
            });
          }}
        />
      </div>
    </div>
  );
}
