"use client";

interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  idKey: keyof T;
  onEdit: (row: T) => void;
  onDelete: (row: T) => void;
  deletingId?: string | number | null;
}

export default function DataTable<T extends object>({
  columns,
  rows,
  idKey,
  onEdit,
  onDelete,
  deletingId,
}: DataTableProps<T>) {
  if (rows.length === 0) {
    return <p className="empty-table">No records found.</p>;
  }

  return (
    <div className="table-wrap admin-table">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const rowId = (row as Record<string, unknown>)[idKey as string];
            const rowKey = String(rowId);
            return (
              <tr key={rowKey}>
                {columns.map((column) => (
                  <td key={column.key}>
                    {column.render
                      ? column.render(row)
                      : String((row as Record<string, unknown>)[column.key] ?? "—")}
                  </td>
                ))}
                <td className="table-actions">
                  <button className="btn" type="button" onClick={() => onEdit(row)}>
                    Edit
                  </button>
                  <button
                    className="btn danger"
                    type="button"
                    disabled={deletingId != null && String(deletingId) === rowKey}
                    onClick={() => onDelete(row)}
                  >
                    {deletingId != null && String(deletingId) === rowKey ? "Deleting…" : "Delete"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
