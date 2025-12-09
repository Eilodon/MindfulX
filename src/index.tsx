import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

console.log("MindfulAI: App mounting...");

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// --- Error Boundary Component ---
// This catches errors anywhere in the child component tree.
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("MindfulAI Critical Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif', color: '#333' }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#D87C4A' }}>Something went wrong.</h1>
          <p style={{ marginBottom: '1rem' }}>The Master is meditating on a bug.</p>
          <div style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '8px', textAlign: 'left', overflow: 'auto' }}>
            <code style={{ color: 'red' }}>{this.state.error?.toString()}</code>
          </div>
          <button 
            onClick={() => window.location.reload()}
            style={{ marginTop: '1.5rem', padding: '0.5rem 1rem', background: '#D87C4A', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Reload Sanctuary
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
    console.error("MindfulAI: Root element not found!");
    throw new Error("Failed to find the root element");
}

try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );
    console.log("MindfulAI: App mounted successfully.");
} catch (err) {
    console.error("MindfulAI: Error during root render:", err);
    // Fallback UI if even ReactDOM crashes
    rootElement.innerHTML = `<div style="color:red; padding:20px;">CRITICAL STARTUP ERROR: ${err}</div>`;
}