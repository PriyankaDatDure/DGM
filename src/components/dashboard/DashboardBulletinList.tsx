"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import type { WeatherBulletinRow } from "@/types/database";
import { formatDateDisplay } from "@/lib/format/dates";
import LineListTable from "@/components/dashboard/LineListTable";

interface Props {
  initialRows: WeatherBulletinRow[];
}

export default function DashboardBulletinList({ initialRows }: Props) {
  const router = useRouter();

  const columns = useMemo(
    () => [
      {
        key: "forecast_date",
        label: "Forecast date",
        render: (r: WeatherBulletinRow) => formatDateDisplay(r.forecast_date),
      },
      { key: "forecaster_name", label: "Forecaster" },
      { key: "submission_status", label: "Status" },
      { key: "validity_period", label: "Validity" },
      {
        key: "bulletin_id",
        label: "Bulletin ID",
        render: (r: WeatherBulletinRow) => r.bulletin_id.slice(0, 8) + "…",
      },
    ],
    []
  );

  return (
    <div className="dashboard-section">
      <div className="dashboard-intro panel">
        <h2>Weather bulletins</h2>
        <p className="desc">
          Click the edit icon to open the transmission form with all 6 steps pre-filled for updating.
        </p>
      </div>

      <div className="panel">
        <LineListTable
          columns={columns}
          rows={initialRows}
          idKey="bulletin_id"
          onEdit={(row) => router.push(`/?edit=${row.bulletin_id}`)}
          emptyMessage="No weather bulletins yet. Submit one from the transmission form."
        />
      </div>
    </div>
  );
}
