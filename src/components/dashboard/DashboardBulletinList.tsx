"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import type { WeatherBulletinRow } from "@/types/database";
import { formatDateDisplay } from "@/lib/format/dates";
import LineListTable from "@/components/dashboard/LineListTable";

interface Props {
  initialRows: WeatherBulletinRow[];
}

export default function DashboardBulletinList({ initialRows }: Props) {
  const router = useRouter();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

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

  const handleDownload = useCallback(async (row: WeatherBulletinRow) => {
    setDownloadingId(row.bulletin_id);
    setDownloadError(null);
    try {
      const response = await fetch(`/api/bulletins/${row.bulletin_id}/pdf`);
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Failed to download PDF.");
      }
      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      const filename =
        match?.[1] ??
        `${(row.forecaster_name ?? "forecaster").trim().replace(/\s+/g, "_")}_${row.bulletin_id}.pdf`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : "Failed to download PDF.");
    } finally {
      setDownloadingId(null);
    }
  }, []);

  return (
    <div className="dashboard-section">
      <div className="dashboard-intro panel">
        <h2>Weather bulletins</h2>
        <p className="desc">
          Use the download icon to export a PDF of all filled form steps, or the edit icon to update a bulletin.
        </p>
      </div>

      {downloadError && <div className="toast error">{downloadError}</div>}

      <div className="panel">
        <LineListTable
          columns={columns}
          rows={initialRows}
          idKey="bulletin_id"
          onEdit={(row) => router.push(`/?edit=${row.bulletin_id}`)}
          onDownload={handleDownload}
          downloadingId={downloadingId}
          emptyMessage="No weather bulletins yet. Submit one from the transmission form."
        />
      </div>
    </div>
  );
}
