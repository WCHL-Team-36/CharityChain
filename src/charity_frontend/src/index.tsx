// ABSOLUTE FIRST LINE - BEFORE EVERYTHING
console.log("🚀 INDEX.TSX: VERY FIRST LINE OF EXECUTION");

// Test if we can even get this far
try {
  console.log("🚀 INDEX.TSX: Basic try block working");
  console.log("🚀 INDEX.TSX: Window object:", typeof window);
  console.log("🚀 INDEX.TSX: Document object:", typeof document);
} catch (firstError) {
  console.error("🚀 INDEX.TSX: CRITICAL ERROR IN FIRST BLOCK:", firstError);
}

// IMMEDIATE CONSOLE LOG AT THE VERY TOP
console.log("🚀🚀🚀 SCRIPT ENTRY POINT - BEFORE ANY IMPORTS 🚀🚀🚀");
console.log("🚀 TIMESTAMP:", new Date().toISOString());
console.log("🚀 DOCUMENT STATE:", document.readyState);
console.log("🚀 WINDOW LOADED:", window.document ? "YES" : "NO");

console.log("🚀 INDEX.TSX: About to import React modules...");

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { WalletProvider } from "./contexts/WalletContext";
import { ToastProvider } from "./contexts/ToastContext";
import "./index.css";

console.log("🚀 IMPORTS COMPLETED SUCCESSFULLY");

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);

console.log("🚀 REACT ROOT CREATED");

// Add global debug and force initialization on app start
if (typeof window !== "undefined") {
  console.log("🚀 INDEX.TSX: Setting up global debug");
  (window as any).APP_DEBUG = {
    forceWalletInit: () => {
      console.log("🔥 FORCING WALLET INITIALIZATION FROM APP LEVEL");
      const event = new CustomEvent("forceWalletInit");
      window.dispatchEvent(event);
    },
  };

  // Test localStorage immediately
  try {
    localStorage.setItem("startup_test", new Date().toISOString());
    console.log("🚀 LOCALSTORAGE TEST SUCCESS:", localStorage.getItem("startup_test"));
  } catch (e) {
    console.error("🚀 LOCALSTORAGE TEST FAILED:", e);
  }
}

console.log("🚀 STARTING REACT RENDER...");

root.render(
  <BrowserRouter>
    <ToastProvider>
      <WalletProvider>
        <App />
      </WalletProvider>
    </ToastProvider>
  </BrowserRouter>
);

console.log("🚀 REACT RENDER COMPLETED!");
