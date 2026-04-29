export const metadata = {
  title: "Admin Panel - Settings",
};

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">System Settings</h2>
        <p className="text-muted-foreground">
          Manage system-wide configurations and features.
        </p>
      </div>
      
      <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
        <p className="text-muted-foreground">Settings configuration coming soon.</p>
      </div>
    </div>
  );
}
