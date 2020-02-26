const express = require("express");
const app = express();
const port = process.env.port || 3000;
const path = require("path");
var ExpressPeerServer = require("peer").ExpressPeerServer;

app.use(express.static(__dirname + "/public"));

app.get("/", function(req, res) {
  res.sendFile(path.join(__dirname + "/public/index.html"));
});

var server = app.listen(port, () =>
  console.log(`App listening on port ${port}`)
);
app.use("/peerjs", ExpressPeerServer(server, { debug: true }));
