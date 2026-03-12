import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// ✅ Bootstrap 5 + Icons (must be imported once)
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

// ✅ Optional but recommended for components like dropdowns/tooltips/modals
import "bootstrap/dist/js/bootstrap.bundle.min.js";

import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);