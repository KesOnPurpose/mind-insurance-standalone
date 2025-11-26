import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Note: Accessibility checker temporarily disabled due to axe-core ESM compatibility issue
// TODO: Re-enable once axe-core is properly configured for Vite ESM
// if (import.meta.env.DEV) {
//   import("./lib/accessibility").then(({ accessibilityChecker }) => {
//     console.log("[A11y] Initializing accessibility monitoring...");
//   });
// }

createRoot(document.getElementById("root")!).render(<App />);
