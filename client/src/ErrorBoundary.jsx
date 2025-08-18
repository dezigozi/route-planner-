import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-content">
            <h2>⚠️ エラーが発生しました</h2>
            <p>申し訳ございませんが、予期しないエラーが発生しました。</p>
            
            <details style={{ marginTop: '1rem' }}>
              <summary>エラー詳細</summary>
              <pre style={{ fontSize: '0.875rem', marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>
                {this.state.error && this.state.error.toString()}
              </pre>
            </details>
            
            <button 
              className="btn btn-primary"
              onClick={() => window.location.reload()}
              style={{ marginTop: '1rem' }}
            >
              ページをリロード
            </button>
          </div>
          
          <style jsx>{`
            .error-boundary {
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              background-color: #f5f5f5;
              padding: 2rem;
            }
            
            .error-content {
              background: white;
              padding: 2rem;
              border-radius: 0.5rem;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              max-width: 600px;
              text-align: center;
            }
            
            .error-content h2 {
              color: #dc2626;
              margin-bottom: 1rem;
            }
            
            .error-content details {
              text-align: left;
              background: #f9fafb;
              padding: 1rem;
              border-radius: 0.375rem;
              border: 1px solid #e5e7eb;
            }
            
            .error-content summary {
              cursor: pointer;
              font-weight: 500;
              color: #374151;
            }
            
            .error-content pre {
              color: #ef4444;
              background: #fef2f2;
              padding: 0.5rem;
              border-radius: 0.25rem;
              border: 1px solid #fecaca;
              overflow: auto;
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;