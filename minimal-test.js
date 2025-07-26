// IMMEDIATE ERROR CATCHING
console.log("🔴 MINIMAL TEST: Script starting...");

try {
  // Test basic functionality first
  console.log("🔴 MINIMAL TEST: localStorage available:", typeof localStorage !== "undefined");
  console.log("🔴 MINIMAL TEST: sessionStorage available:", typeof sessionStorage !== "undefined");
  console.log("🔴 MINIMAL TEST: window available:", typeof window !== "undefined");

  // Test DOM
  console.log("🔴 MINIMAL TEST: document ready state:", document.readyState);
  console.log("🔴 MINIMAL TEST: root element exists:", !!document.getElementById("root"));

  // Try simple React import
  console.log("🔴 MINIMAL TEST: About to test React import...");

  // Simulate what our app does
  if (typeof window !== "undefined") {
    console.log("🔴 MINIMAL TEST: Setting up window object...");
    window.TEST_APP = {
      status: "working",
    };
    console.log("🔴 MINIMAL TEST: Window object set successfully");
  }

  // Try localStorage
  try {
    localStorage.setItem("minimal_test", "working");
    console.log("🔴 MINIMAL TEST: localStorage test success:", localStorage.getItem("minimal_test"));
  } catch (storageError) {
    console.error("🔴 MINIMAL TEST: localStorage error:", storageError);
  }

  console.log("🔴 MINIMAL TEST: All basic tests passed");
} catch (error) {
  console.error("🔴 MINIMAL TEST: Critical error:", error);
  console.error("🔴 MINIMAL TEST: Error stack:", error.stack);
}
