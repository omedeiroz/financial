import { Component } from 'react';
import styles from './ErrorBoundary.module.css';

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className={styles.container}>
          <span className={styles.title}>Algo deu errado</span>
          <span className={styles.msg}>{this.state.error.message}</span>
          <button
            className={styles.btn}
            onClick={() => {
              this.setState({ error: null });
              window.location.reload();
            }}
          >
            Recarregar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
