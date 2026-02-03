import React from 'react'
// WebSocket 호환성을 위한 global 정의
if (typeof window !== 'undefined') {
  (window as any).global = window;
}

import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'  // <--- ★ 이 줄이 반드시 있어야 스타일이 먹힙니다!

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)