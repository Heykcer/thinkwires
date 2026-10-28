import React, { Component } from 'react';
import './errorBoundary.css';

/**
 * Catches uncaught render/lifecycle errors across the component tree,
 * logs diagnostics, and renders a fallback UI with recovery actions.
 */
class GlobalErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      copied: false,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });

    console.error('[GlobalErrorBoundary] Caught rendering exception:', {
      error,
      errorInfo,
      time: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : '',
    });

    if (typeof this.props.onError === 'function') {
      try {
        this.props.onError(error, errorInfo);
      } catch (cbErr) {
        console.warn('Error in ErrorBoundary onError callback:', cbErr);
      }
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      copied: false,
    });
  };

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  handleCopyReport = () => {
    const { error, errorInfo } = this.state;
    const report = {
      product: 'Thinkwires Enterprise Platform',
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      errorName: error?.name || 'Error',
      errorMessage: error?.message || 'Unknown error occurred',
      stack: error?.stack || 'No stack trace available',
      componentStack: errorInfo?.componentStack || 'No component stack available',
    };

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard
        .writeText(JSON.stringify(report, null, 2))
        .then(() => {
          this.setState({ copied: true });
          setTimeout(() => this.setState({ copied: false }), 3000);
        })
        .catch(() => {});
    }
  };

  toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  render() {
    const { hasError, error, errorInfo, showDetails, copied } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      if (typeof fallback === 'function') {
        return fallback({
          error,
          errorInfo,
          reset: this.handleReset,
          reload: this.handleReload,
        });
      }

      return (
        <div className="tw-error-boundary-wrapper" role="alert">
          <div className="tw-error-boundary-card">
            <div className="tw-error-icon-ring">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>

            <div className="tw-error-badge">System Fault Recovered</div>

            <h1 className="tw-error-title">An Unexpected Issue Occurred</h1>
            <p className="tw-error-subtitle">
              The application encountered an unhandled condition while loading this component.
              Our diagnostics have captured this event. You can attempt to refresh the page or return to the main portal.
            </p>

            <div className="tw-error-actions">
              <button
                type="button"
                className="tw-btn-error-primary"
                onClick={this.handleReload}
                id="btn-error-reload"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.19" />
                </svg>
                Reload Application
              </button>

              <button
                type="button"
                className="tw-btn-error-secondary"
                onClick={this.handleReset}
                id="btn-error-retry"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                </svg>
                Try Again
              </button>

              <button
                type="button"
                className="tw-btn-error-secondary"
                onClick={this.handleGoHome}
                id="btn-error-home"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                Return Home
              </button>

              <button
                type="button"
                className="tw-btn-error-ghost"
                onClick={this.handleCopyReport}
                id="btn-error-copy"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                {copied ? 'Diagnostic Copied!' : 'Copy Error Details'}
              </button>
            </div>

            <div>
              <button
                type="button"
                className="tw-error-diagnostics-toggle"
                onClick={this.toggleDetails}
                aria-expanded={showDetails}
              >
                <span>{showDetails ? '▲ Hide Technical Details' : '▼ View Technical Diagnostics'}</span>
              </button>

              {showDetails && (
                <div className="tw-error-diagnostics-drawer">
                  <strong>Error: {error?.name || 'Error'}: {error?.message}</strong>
                  {error?.stack && <pre>{error.stack}</pre>}
                  {errorInfo?.componentStack && (
                    <div className="tw-diagnostics-stack">
                      <strong>Component Stack:</strong>
                      <pre>{errorInfo.componentStack}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

export default GlobalErrorBoundary;
