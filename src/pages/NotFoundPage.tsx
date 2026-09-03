import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';

export function NotFoundPage({ message = 'La página que buscas no existe.' }: { message?: string }) {
  useDocumentTitle('No encontrado');
  return (
    <EmptyState
      illustration="soup"
      title="Ups, aquí no hay nada servido"
      description={message}
      action={
        <Button to="/recetas" variant="primary" icon="compass">
          Explorar recetas
        </Button>
      }
    />
  );
}
