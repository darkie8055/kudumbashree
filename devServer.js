const express = require("express");
const app = express();
const port = 19000;

const notifications = [];
let connections = [];

app.use(express.json());

app.post("/notifications", (req, res) => {
  const notification = req.body;
  notifications.push(notification);
  connections.forEach((connection) => {
    connection.res.write(`data: ${JSON.stringify(notification)}\n\n`);
  });
  res.status(200).json({ message: "Notification sent" });
});

app.get("/notifications/subscribe", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const connection = { req, res };
  connections.push(connection);

  req.on("close", () => {
    connections = connections.filter((c) => c !== connection);
  });
});

app.listen(port, () => {
  console.log(`Dev server running on port ${port}`);
});
