import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  props: Props;
  state: State;

  constructor(props: Props) {
    super(props);
    this.props = props;
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.clear();
    } catch (e) {
      console.error(e);
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-900 font-sans antialiased">
          <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto text-xl font-bold">
              !
            </div>
            <h2 className="text-lg font-bold text-slate-900">เกิดข้อผิดพลาดในการโหลดระบบ</h2>
            <p className="text-xs text-slate-500 leading-relaxed font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-left overflow-x-auto max-h-32">
              {this.state.error?.message || 'An unexpected runtime error occurred.'}
            </p>
            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition-colors shadow-xs"
              >
                โหลดหน้านี้ใหม่ (Reload)
              </button>
              <button
                onClick={this.handleReset}
                className="w-full py-2 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-xl text-xs transition-colors border border-rose-200"
              >
                รีเซ็ตข้อมูลล้าง Cache (Reset All Data)
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
