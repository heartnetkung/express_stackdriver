const express = require("express");
const router = (module.exports = express.Router());

router.get("/hello", (req, res) => {
	res.send("world");
});
router.get("/json", (req, res) => {
	res.send({ hello: "world" });
});
router.get("/param/:param1", (req, res) => {
	res.send(req.params.param1);
});
router.get("/slow", (req, res) => {
	setTimeout(() => res.send("slow"), 2000);
});
router.get("/error", (req, res) => {
	throw new Error("Uncaught!");
});
router.get("/400", (req, res) => {
	res.status(400).send({ error: "handled" });
});
router.get("/ignore/:data", (req, res) => {
	res.send("1234");
});
router.post("/login", (req, res) => {
	console.log(res.body);
	res.send("ok");
});
router.get("/log/:user", (req, res) => {
	req.appendLog('_user_id', req.params.user)
	res.send("ok");
});
