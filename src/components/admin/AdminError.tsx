interface AdminErrorProps {
  message: string;
}

export default function AdminError({ message }: AdminErrorProps) {
  return (
    <div className="panel admin-error">
      <h2>Database unavailable</h2>
      <p>{message}</p>
      <p className="hint">
        Ensure <code>DATABASE_PASSWORD</code> and other variables are set in <code>.env.local</code>,
        then restart the dev server.
      </p>
    </div>
  );
}
