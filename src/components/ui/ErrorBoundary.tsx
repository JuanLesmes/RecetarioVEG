import { Component, type ErrorInfo, type ReactNode } from 'react';
import { DishIllustration } from '@/components/illustrations/DishIllustration';

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Error no controlado en la interfaz:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="container" style={{ padding: '4rem 0' }}>
          <div className="empty">
            <div className="empty__art">
              <DishIllustration name="stew" />
            </div>
            <h3>Algo se nos quemó</h3>
            <p>{this.state.error.message}</p>
            <button type="button" className="btn btn--primary" onClick={() => window.location.reload()}>
              Recargar la página
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
