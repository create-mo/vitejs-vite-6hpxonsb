import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error('🔴 ERROR BOUNDARY:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          width: '100%',
          height: '100vh',
          background: '#1a1a1a',
          color: '#e5e5e5',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'monospace',
          padding: '20px',
          textAlign: 'center',
        }}>
          <h1>🔴 Error in App</h1>
          <pre style={{ maxWidth: '600px', textAlign: 'left', background: '#0a0a0a', padding: '20px', borderRadius: '8px', overflow: 'auto' }}>
            {this.state.error?.message}
            {'\n\n'}
            {this.state.error?.stack}
          </pre>
          <button onClick={() => window.location.reload()} style={{
            marginTop: '20px',
            padding: '10px 20px',
            background: '#0066ff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}>
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
