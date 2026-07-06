"use client";

import EditIconButton from "@/components/admin/EditIconButton";
import DownloadIconButton from "@/components/admin/DownloadIconButton";

interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
}

interface LineListTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  idKey: keyof T;
  onEdit: (row: T) => void;
  onDownload?: (row: T) => void;
  downloadingId?: string | null;
  emptyMessage?: string;
}

export default function LineListTable<T extends object>({
  columns,
  rows,
  idKey,
  onEdit,
  onDownload,
  downloadingId = null,
  emptyMessage = "No records found.",
}: LineListTableProps<T>) {
  if (rows.length === 0) {
    return <p className="empty-table">{emptyMessage}</p>;
  }

  return (
    <div className="table-wrap line-list-table">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
            <th className="line-list-actions-col" aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const rowId = (row as Record<string, unknown>)[idKey as string];
            return (
              <tr key={String(rowId)}>
                {columns.map((column) => (
                  <td key={column.key}>
                    {column.render
                      ? column.render(row)
                      : String((row as Record<string, unknown>)[column.key] ?? "—")}
                  </td>
                ))}
                <td className="table-actions line-list-actions">
                  <EditIconButton onClick={() => onEdit(row)} />
                  {onDownload && (
                    <DownloadIconButton
                      onClick={() => onDownload(row)}
                      disabled={downloadingId === String(rowId)}
                    />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
