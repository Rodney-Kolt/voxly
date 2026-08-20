import React from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center gap-4">
      {icon && <div className="text-4xl">{icon}</div>}
      <div>
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        {description && <p className="mt-1 text-sm text-gray-400">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
