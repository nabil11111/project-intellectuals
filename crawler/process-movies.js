const loginAndNavigate = require("./crawler-files");
const saveSanitizedList = require("./sanitizer");
const compareAndAppend = require("./compare");
const fs = require("fs").promises;
const path = require("path");

async function processMovies() {
  try {
    // Ensure data directory exists
    const dataPath = path.join(process.cwd(), "data");
    await fs.mkdir(dataPath, { recursive: true });

    console.log("=".repeat(50));
    console.log("Starting crawler-files.js");
    console.log("=".repeat(50) + "\n");
    await loginAndNavigate();
    console.log("\n" + "-".repeat(50));
    console.log("✓ crawler-files.js completed successfully");
    console.log("-".repeat(50) + "\n");

    console.log("=".repeat(50));
    console.log("Starting sanitizer.js");
    console.log("=".repeat(50) + "\n");
    await saveSanitizedList();
    console.log("\n" + "-".repeat(50));
    console.log("✓ sanitizer.js completed successfully");
    console.log("-".repeat(50) + "\n");

    console.log("=".repeat(50));
    console.log("Starting compare.js");
    console.log("=".repeat(50) + "\n");
    await compareAndAppend();
    console.log("\n" + "-".repeat(50));
    console.log("✓ compare.js completed successfully");
    console.log("-".repeat(50) + "\n");

    return true;
  } catch (error) {
    console.error("Error processing movies:", error);
    throw error;
  }
}

module.exports = processMovies;
