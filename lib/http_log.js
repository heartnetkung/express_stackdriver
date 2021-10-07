const onHeaders = require("on-headers");
const _ = require("lodash");
const { exec } = require("child_process");
const rootPath = require("app-root-path");
const { createLogger } = require("./bunyan_facade");

exports.logMiddleware = (options) => {
	var logger = createLogger(options, "HTTP");
	var ignoreBody = handleIgnoreReqBody(options);
	var ignoreRoute = handleIgnoreRoute(options);
	var commitIdData = handleCommitId();
	var packageJson = rootPath.require("package.json");

	return (req, res, next) => {
		if (req.originalUrl === "/favicon.ico") return next();

		//write doc
		var appendLogData = handleAppendLog(req);
		var timingData = handleTiming(res);

		getResponse(res, (chunks) => {
			var { route, originalUrl, headers, method, params, body } = req;

			var logInfo = {
				etc: {
					appName: packageJson.name,
					timeToFirstByte: timingData.value,
					commit: commitIdData.value,
				},
				_params: params,
				_reqBody: /multipart/i.test(headers["content-type"])
					? "skipped"
					: ignoreBody(body),
				method: method,
				route: route ? req.baseUrl + route.path : originalUrl,
				status: res.statusCode,
			};

			if (ignoreRoute.has(logInfo.route)) return;

			if (!/utf-8/i.test(res.getHeaders()["content-type"]))
				logInfo._resBody = "skipped";
			else if (Array.isArray(chunks))
				logInfo._resBody = toJson(
					Buffer.concat(chunks).toString("utf8")
				);
			else logInfo._resBody = toJson(chunks);
			
			const size = Buffer.byteLength(JSON.stringify(logInfo._resBody))
			const kiloBytes = size / 1024;
			if (kiloBytes > 256) {
				logInfo = {
					...logInfo,
					_reqBody: "skipped"
				}
			}
			
			if (options && options.ignoreBody[0] === '*') logInfo._resBody = {}
			logger(
				Object.assign(appendLogData, logInfo),
				`${logInfo.status} ${logInfo.method} ${logInfo.route}`
			);
		});
		next();
	};
};

const handleAppendLog = (req) => {
	var ans = {};
	req.appendLog = (key, value) => (ans[key] = value);
	return ans;
};

const handleTiming = (res) => {
	var ans = { value: -1 };
	var timerStart = process.hrtime.bigint();
	onHeaders(res, () => {
		var timeDiff = Number(process.hrtime.bigint() - timerStart);
		ans.value = Math.round(timeDiff / 1000) / 1000;
	});
	return ans;
};

const toJson = (string) => {
	try {
		return JSON.parse(string);
	} catch (e) {
		return string;
	}
};

const handleCommitId = () => {
	var ans = { value: null };
	exec("git rev-parse HEAD", { cwd: rootPath.toString() }, (err, stdout) => {
		var strOut = Buffer.isBuffer(stdout) ? stdout.toString("utf8") : stdout;
		ans.value = strOut.trim();
	});
	return ans;
};

const handleIgnoreRoute = (options) => new Set(options.ignoreRoute || []);

const handleIgnoreReqBody = (options) => {
	if (!options.ignoreBody) return (a) => a;
	if (options.ignoreBody[0] === '*') return () => {};
	return (body) => (body ? _.omit(body, options.ignoreBody) : null);
};

const getResponse = (res, cb) => {
	var oldWrite = res.write;
	var oldEnd = res.end;
	var chunks = [];

	res.write = function (chunk) {
		if (chunk && Buffer.isBuffer(chunk)) chunks.push(chunk);
		oldWrite.apply(res, arguments);
	};

	res.end = function (chunk) {
		if (chunk && Buffer.isBuffer(chunk)) chunks.push(chunk);
		oldEnd.apply(res, arguments);
		cb(chunks.length ? chunks : chunk);
	};
};
