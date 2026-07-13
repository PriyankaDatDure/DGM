"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { WeatherBulletinRow } from "@/types/database";
import type { SubmissionStatus } from "@/lib/bulletin/types";
import { formatDateDisplay } from "@/lib/format/dates";
import { useEnumLabels } from "@/lib/i18n/use-enum-labels";
import { SUBMISSION_STATUS_I18N_KEYS } from "@/lib/i18n/enum-keys";
import LineListTable from "@/components/dashboard/LineListTable";

interface Props {
  initialRows: WeatherBulletinRow[];
}

function isSubmissionStatus(value: string | null): value is SubmissionStatus {
  return value !== null && value in SUBMISSION_STATUS_I18N_KEYS;
}

export default function DashboardBulletinList({ initialRows }: Props) {
  const router = useRouter();
  const t = useTranslations("dashboard");
  const { submissionStatus } = useEnumLabels();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const columns = useMemo(
    () => [
      {
        key: "forecast_date",
        label: t("columns.forecastDate"),
        className: "line-list-col-date",
        render: (r: WeatherBulletinRow) => formatDateDisplay(r.forecast_date),
      },
      { key: "forecaster_name", label: t("columns.forecaster"), className: "line-list-col-forecaster" },
      {
        key: "submission_status",
        label: t("columns.status"),
        className: "line-list-col-status",
        render: (r: WeatherBulletinRow) => {
          const status = r.submission_status;
          if (isSubmissionStatus(status)) return submissionStatus(status);
          return status ?? "—";
        },
      },
      { key: "validity_period", label: t("columns.validity"), className: "line-list-col-validity" },
      {
        key: "bulletin_id",
        label: t("columns.bulletinId"),
        className: "line-list-col-id",
        render: (r: WeatherBulletinRow) => r.bulletin_id,
      },
    ],
    [t, submissionStatus]
  );

  const handleDownload = useCallback(async (row: WeatherBulletinRow) => {
    setDownloadingId(row.bulletin_id);
    setDownloadError(null);
    try {
      const response = await fetch(`/api/bulletins/${row.bulletin_id}/pdf`);
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? t("downloadFailed"));
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
      setDownloadError(error instanceof Error ? error.message : t("downloadFailed"));
    } finally {
      setDownloadingId(null);
    }
  }, [t]);

  return (
    <div className="dashboard-section">
      <div className="dashboard-intro panel">
        <h2>{t("title")}</h2>
        <p className="desc">{t("description")}</p>
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
          emptyMessage={t("empty")}
        />
      </div>
    </div>
  );
}
