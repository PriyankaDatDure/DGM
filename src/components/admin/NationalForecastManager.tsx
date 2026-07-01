"use client";

import { useMemo, useState, useTransition } from "react";
import {
  createNationalForecast,
  deleteNationalForecast,
  updateNationalForecast,
} from "@/actions/national-forecast";
import type { NationalForecastInput } from "@/types/actions";
import type { NationalForecastRow, WeatherBulletinOption } from "@/types/database";
import { formatDateDisplay } from "@/lib/format/dates";
import BulletinContextFields, { emptyBulletinContext } from "@/components/admin/BulletinContextFields";
import BulletinSelect from "@/components/admin/BulletinSelect";
import DataTable from "@/components/admin/DataTable";
import StatusMessage from "@/components/admin/StatusMessage";
import WeatherFieldInputs, {
  emptyWeatherFieldInput,
  rowToWeatherFieldInput,
} from "@/components/admin/WeatherFieldInputs";
import { rowToBulletinContext } from "@/lib/validation/weather-fields";

interface Props {
  initialRows: NationalForecastRow[];
  bulletinOptions: WeatherBulletinOption[];
}

export default function NationalForecastManager({ initialRows, bulletinOptions }: Props) {
  const [rows, setRows] = useState(initialRows);
  const [bulletinId, setBulletinId] = useState("");
  const [context, setContext] = useState(emptyBulletinContext());
  const [weather, setWeather] = useState(emptyWeatherFieldInput());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  const columns = useMemo(
    () => [
      { key: "national_forecast_id", label: "ID" },
      {
        key: "bulletin_id",
        label: "Bulletin ID",
        render: (r: NationalForecastRow) => r.bulletin_id.slice(0, 8) + "…",
      },
      { key: "forecast_date", label: "Date", render: (r: NationalForecastRow) => formatDateDisplay(r.forecast_date) },
    ],
    []
  );

  const resetForm = () => {
    setBulletinId("");
    setContext(emptyBulletinContext());
    setWeather(emptyWeatherFieldInput());
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
            const input: NationalForecastInput = { bulletin_id: bulletinId, ...context, ...weather };
            const result = editingId
              ? await updateNationalForecast(editingId, input)
              : await createNationalForecast(input);
            if (!result.success) {
              setMessage({ type: "error", text: result.error });
              return;
            }
            setRows((current) =>
              editingId
                ? current.map((row) => (row.national_forecast_id === editingId ? result.data : row))
                : [result.data, ...current]
            );
            setMessage({ type: "success", text: result.message ?? "Saved." });
            resetForm();
          });
        }}
      >
        <h2>{editingId ? `Edit national forecast #${editingId}` : "Create national forecast"}</h2>
        <BulletinSelect value={bulletinId} options={bulletinOptions} onChange={setBulletinId} />
        <BulletinContextFields values={context} onChange={setContext} />
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
        <h2>All national forecasts</h2>
        <DataTable
          columns={columns}
          rows={rows}
          idKey="national_forecast_id"
          deletingId={deletingId}
          onEdit={(row) => {
            setEditingId(row.national_forecast_id);
            setBulletinId(row.bulletin_id);
            setContext(rowToBulletinContext(row));
            setWeather(rowToWeatherFieldInput(row));
          }}
          onDelete={(row) => {
            if (!window.confirm(`Delete national forecast #${row.national_forecast_id}?`)) return;
            setDeletingId(row.national_forecast_id);
            startTransition(async () => {
              const result = await deleteNationalForecast(row.national_forecast_id);
              setDeletingId(null);
              if (!result.success) {
                setMessage({ type: "error", text: result.error });
                return;
              }
              setRows((current) =>
                current.filter((item) => item.national_forecast_id !== row.national_forecast_id)
              );
              setMessage({ type: "success", text: result.message ?? "Deleted." });
            });
          }}
        />
      </div>
    </div>
  );
}
