const express = require("express");
const cors = require("cors");
const processMovies = require("./crawler/process-movies");

const app = express();
app.use(cors());

app.get("/run-update", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const originalLog = console.log;
  console.log = function (...args) {
    originalLog.apply(console, args);
    res.write(`data: ${JSON.stringify({ data: args.join(" ") })}\n\n`);
  };

  processMovies()
    .then(() => {
      res.write(`data: ${JSON.stringify({ data: "Update complete" })}\n\n`);
      res.end();
    })
    .catch((error) => {
      res.write(
        `data: ${JSON.stringify({ data: `Error: ${error.message}` })}\n\n`
      );
      res.end();
    })
    .finally(() => {
      console.log = originalLog;
    });

  req.on("close", () => {
    console.log = originalLog;
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
