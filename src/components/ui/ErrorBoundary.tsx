import React, { type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage?: string;
}

// Classe de ErrorBoundary compatível com React 18/19 sem dependências externas
export class ErrorBoundary extends (React.Component as unknown as {
  new (props: ErrorBoundaryProps): {
    props: ErrorBoundaryProps;
    state: ErrorBoundaryState;
    setState(state: Partial<ErrorBoundaryState>): void;
  };
}) {
  state: ErrorBoundaryState = { hasError: false };
  props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'Erro inesperado de renderização',
    };
  }

  componentDidCatch(error: Error, errorInfo: unknown): void {
    console.error('ErrorBoundary capturou um erro no módulo:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          id="module-error-boundary-fallback"
          className="w-full min-h-[300px] flex flex-col items-center justify-center p-8 bg-white rounded-xl border border-rose-200 shadow-sm text-center"
        >
          <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mb-4 text-rose-600">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            Ocorreu um erro ao carregar este módulo
          </h3>
          <p className="text-xs text-slate-500 max-w-md mb-5 leading-relaxed">
            Houve uma falha inesperada na renderização da visualização atual. Os dados da sua conta permanecem seguros.
          </p>
          <button
            type="button"
            id="error-boundary-reload-button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            Recarregar Módulo
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
