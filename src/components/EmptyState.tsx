import { LucideIcon } from 'lucide-react';

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
};

export const EmptyState = ({ icon: Icon, title, description }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <Icon className="w-16 h-16 text-primary mb-4" style={{ filter: 'drop-shadow(0 0 12px rgba(109,94,240,0.35))' }} />
      <h3 className="text-lg font-semibold text-textc mb-2">{title}</h3>
      {description && <p className="text-sm text-textdim">{description}</p>}
    </div>
  );
};
