import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./App.css";
import { DataProvider } from './DataContext';
createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <DataProvider> {/* <-- 2. WRAP YOUR APP */}
      <App />
    </DataProvider>
  </BrowserRouter>
);
