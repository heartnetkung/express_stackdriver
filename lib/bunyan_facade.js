const bunyan = require("bunyan");
const { LoggingBunyan } = require("@google-cloud/logging-bunyan");
const localStream = require("bunyan-debug-stream");

exports.createLogger = (options, name) => {
	var logger = bunyan.createLogger({
		name,
		streams: options.local
			? [{ stream: getLocalStream(), level: "info", type: "raw" }]
			: [getStackdriver(options, name).stream("info")],
	});

	if (logger.fields) {
		delete logger.fields.hostname;
		delete logger.fields.pid;
		delete logger.fields.name;
	}

	return (obj, str) => logger.info(obj, str);
};

const getLocalStream = () =>
	localStream({ showPid: false, showLoggerName: false });

var stackdriver = null;
const getStackdriver = (options, logName) => {
	var { credentials, keyFilename } = options;
	if (!stackdriver) {
		var config = credentials
			? { logName, credentials, projectId: credentials.project_id }
			: { logName, keyFilename };
		stackdriver = new LoggingBunyan(config);
	}

	return stackdriver;
};
