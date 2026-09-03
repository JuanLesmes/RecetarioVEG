import type { ReactNode } from 'react';
import type { Visual } from '@/domain/recipe';
import { DishIllustration } from '@/components/illustrations/DishIllustration';

interface EmptyStateProps {
  illustration?: Visual;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ illustration = 'bowl', title, description, action }: EmptyStateProps) {
  return (
    <div className="empty" role="status">
      <div className="empty__art">
        <DishIllustration name={illustration} />
      </div>
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {action}
    </div>
  );
}
