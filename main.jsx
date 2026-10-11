import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

import "./index.css";
import "./App.css";
import "./AdminPages.css";
import "./AboutPremium.css";

import { initNotifications } from "./notifications.js";

// Start Push Notifications
initNotifications();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);


