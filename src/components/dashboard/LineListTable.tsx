"use client";

import EditIconButton from "@/components/admin/EditIconButton";

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
  emptyMessage?: string;
}

export default function LineListTable<T extends object>({
  columns,
  rows,
  idKey,
  onEdit,
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
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
