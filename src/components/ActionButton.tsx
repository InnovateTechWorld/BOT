import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface ActionButtonProps {
  icon?: LucideIcon;
  label: string;
  onClick?: () => void;
}

export function ActionButton({ icon: Icon, label, onClick }: ActionButtonProps) {
  return (
    <Button
      variant="outline"
      className="hover-scale flex items-center gap-2 h-10 px-4 py-2"
      onClick={onClick}
    >
      {Icon && <Icon className="w-4 h-4" />}
      <span>{label}</span>
    </Button>
  );
}