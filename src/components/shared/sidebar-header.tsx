import { LucideIcon } from "lucide-react";

function SidebarHeader({
  title,
  icon: Icon,
}: {
  title: string;
  icon: LucideIcon;
}) {
  return (
    <div className="flex items-center gap-2 font-semibold text-sm text-foreground uppercase tracking-wide">
      <div className="bg-primary/10 p-1.5 rounded-lg shadow-sm">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <span>{title}</span>
    </div>
  );
}

export default SidebarHeader;
