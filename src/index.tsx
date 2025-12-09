import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

console.log("MindfulAI: App mounting...");

const rootElement = document.getElementById('root');
if (!rootElement) {
    console.error("MindfulAI: Root element not found!");
    throw new Error("Failed to find the root element");
}

try {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("MindfulAI: App mounted successfully.");
} catch (err) {
    console.error("MindfulAI: Error during render:", err);
}