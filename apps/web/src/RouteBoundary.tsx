import { Component, type ReactNode } from "react";
export class RouteBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="error-box" role="alert">
        <div>
          <h1>Não foi possível abrir esta página.</h1>
          <p>
            Confira sua conexão e tente recarregar. Alterações ainda não
            confirmadas pelo servidor podem precisar ser refeitas.
          </p>
          <button
            className="button secondary"
            onClick={() => window.location.reload()}
          >
            Recarregar página
          </button>
        </div>
      </div>
    ) : (
      this.props.children
    );
  }
}
