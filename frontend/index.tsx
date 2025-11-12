import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./styles.css";

// ✅ Get the root element safely
const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error("Root element not found. Make sure <div id='root'></div> exists in index.html.");
} else {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
