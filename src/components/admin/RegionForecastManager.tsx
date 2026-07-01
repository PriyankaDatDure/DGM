"use client";

import { useMemo, useState, useTransition } from "react";
import {
  createRegionForecast,
  deleteRegionForecast,
  updateRegionForecast,
} from "@/actions/region-forecast";
import { REGIONS, regionDisplayLabel } from "@/lib/bulletin/constants";
import { isRegionCode } from "@/lib/bulletin/region-prefectures";
import type { RegionForecastInput } from "@/types/actions";
import type { RegionForecastRow, WeatherBulletinOption } from "@/types/database";
import BulletinSelect from "@/components/admin/BulletinSelect";
import DataTable from "@/components/admin/DataTable";
import StatusMessage from "@/components/admin/StatusMessage";
import WeatherFieldInputs, {
  emptyWeatherFieldInput,
  rowToWeatherFieldInput,
} from "@/components/admin/WeatherFieldInputs";

interface Props {
  initialRows: RegionForecastRow[];
  bulletinOptions: WeatherBulletinOption[];
}

export default function RegionForecastManager({ initialRows, bulletinOptions }: Props) {
  const [rows, setRows] = useState(initialRows);
  const [bulletinId, setBulletinId] = useState("");
  const [weather, setWeather] = useState(emptyWeatherFieldInput());
  const [regionCode, setRegionCode] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  const columns = useMemo(
    () => [
      { key: "region_forecast_id", label: "ID" },
      {
        key: "bulletin_id",
        label: "Bulletin ID",
        render: (r: RegionForecastRow) => r.bulletin_id.slice(0, 8) + "…",
      },
      {
        key: "region_code",
        label: "Region",
        render: (r: RegionForecastRow) =>
          isRegionCode(r.region_code) ? regionDisplayLabel(r.region_code) : r.region_code,
      },
      { key: "temp_max_c", label: "Max °C" },
    ],
    []
  );

  const resetForm = () => {
    setBulletinId("");
    setWeather(emptyWeatherFieldInput());
    setRegionCode("");
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
            const input: RegionForecastInput = {
              bulletin_id: bulletinId,
              region_code: regionCode,
              ...weather,
            };
            const result = editingId
              ? await updateRegionForecast(editingId, input)
              : await createRegionForecast(input);
            if (!result.success) {
              setMessage({ type: "error", text: result.error });
              return;
            }
            setRows((current) =>
              editingId
                ? current.map((row) => (row.region_forecast_id === editingId ? result.data : row))
                : [result.data, ...current]
            );
            setMessage({ type: "success", text: result.message ?? "Saved." });
            resetForm();
          });
        }}
      >
        <h2>{editingId ? `Edit region forecast #${editingId}` : "Create region forecast"}</h2>
        <BulletinSelect value={bulletinId} options={bulletinOptions} onChange={setBulletinId} />
        <div className="field">
          <label>Region *</label>
          <select value={regionCode} onChange={(e) => setRegionCode(e.target.value)} required>
            <option value="">— Select —</option>
            {REGIONS.map((region) => (
              <option key={region} value={region}>{regionDisplayLabel(region)}</option>
            ))}
          </select>
        </div>
        <WeatherFieldInputs values={weather} onChange={setWeather} />
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
        <h2>All region forecasts</h2>
        <DataTable
          columns={columns}
          rows={rows}
          idKey="region_forecast_id"
          deletingId={deletingId}
          onEdit={(row) => {
            setEditingId(row.region_forecast_id);
            setBulletinId(row.bulletin_id);
            setRegionCode(row.region_code);
            setWeather(rowToWeatherFieldInput(row));
          }}
          onDelete={(row) => {
            if (!window.confirm(`Delete region forecast #${row.region_forecast_id}?`)) return;
            setDeletingId(row.region_forecast_id);
            startTransition(async () => {
              const result = await deleteRegionForecast(row.region_forecast_id);
              setDeletingId(null);
              if (!result.success) {
                setMessage({ type: "error", text: result.error });
                return;
              }
              setRows((current) =>
                current.filter((item) => item.region_forecast_id !== row.region_forecast_id)
              );
              setMessage({ type: "success", text: result.message ?? "Deleted." });
            });
          }}
        />
      </div>
    </div>
  );
}
