## Description
Opinionated Expressjs middleware for logging of production server using Google Stackdriver API.

## Usage
```
npm install express-stackdriver
```
```js
const express = require("express");
const { logMiddleware } = require("test-stackdriver");

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Don't forget to obtain google credentials. See "google_credentials.example.json" for example.
app.use(
	logMiddleware({
		keyFilename: path.join(__dirname, "../google_credentials.json"),
	})
);

app.get('/', (req, res) => res.send('hello world'));
app.listen(3000);
```

## Options
```js
{
	keyFilename: String, //path to google credentials json
	credentials: Object, //object from reading google credentials json (either keyFilename or credentials must exists to connect to google server)
	local: Boolean, //if true, log to stdout instead (optional)
	ignoreRoute: Array(String), //ignore irrelevant routes or routes that return sensitive information (optional)
	ignoreBody: Array(String) //ignore fields that contain sensitive information such as user password (optional)
}
```
For full usage example, see play folder.

## Custom Logging
```js
router.get("/log/:user", (req, res) => {
	req.appendLog('_user_id', req.params.user)
	res.send("ok");
});
```