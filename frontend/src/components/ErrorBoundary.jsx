import { Component } from 'react';

/** Catches render errors (for example a WebGL failure) and shows a friendly fallback. */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('[COSMIC DINE] render error:', error, info?.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.fallback) return this.props.fallback(error, this.reset);
    return (
      <div className="fallback-panel glass" role="alert">
        <h2>Something drifted off course</h2>
        <p>{this.props.message || 'This view hit an unexpected problem.'}</p>
        <button type="button" className="btn btn-primary" onClick={this.reset}>
          Try again
        </button>
      </div>
    );
  }
}
