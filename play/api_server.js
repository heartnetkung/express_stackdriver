const express = require("express");
const bodyParser = require("body-parser");
const router = require("./api_server_routers");
const { logMiddleware } = require("../lib/http_log");
const path = require("path");
require("express-async-errors");

// express boilerplate1
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//logger boilerplate
app.use(
	logMiddleware({
		local: true,
		keyFilename: path.join(__dirname, "../google_credentials.json"),
		ignoreRoute: ["/ignore/:data"],
		ignoreBody: ["password"],
	})
);

// routers
app.use(router);
app.use("/abc", router);

// express boilerplate2
app.use((req, res, next) => res.status(404).send({ error: "page not found" }));
app.use((err, req, res, next) =>
	res.status(err.status || 500).send({ error: "Unhandled!" })
);
app.listen(3000);
