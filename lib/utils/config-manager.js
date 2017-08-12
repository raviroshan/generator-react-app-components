'use strict';
const fs = require('fs');
const path = require('path');

var getValue = require('object-getvalue');
var argv = require('minimist')(process.argv.slice(2));

const configManager = (function () {

	console.log('--config : ', argv.config);

	// console.log('__dirname : ', __dirname);
	// console.log('process : ', process);
	// console.log('PWD : ', process.env.PWD);

	// Config file will have priority as follow :
	// 1. If --config is passed, the respective file will be read.
	// 2. If reactgenerator.json is present in Present Working Directory, that will be read.
	// 3. If previous 2 options fails or NOT available, then package's default setting will be read.


	// Read default configuration settings from package directory

	var configDefaultFilePath = path.resolve(__dirname, '../reactgenerator.json');
	// console.log('configDefaultFilePath: ', configDefaultFilePath);

	var configDefaultJSON;
	if (fs.existsSync(configDefaultFilePath)) {
		configDefaultJSON = fs.readFileSync(configDefaultFilePath, 'utf8');
		configDefaultJSON = JSON.parse(configDefaultJSON);
		// console.log('configDefaultJSON: ', configDefaultJSON);
	}

	// -------------------

	// Read new/custom configuration settings from --config path or PWD file

	var configCustomFilePath = '';
	var configCustomJSON = '{}';

	if (argv.config) {
		// Look for custom configuration file at --config path
		configCustomFilePath = path.resolve(process.env.PWD, argv.config);
		console.log('configCustomFilePath: ', configCustomFilePath);

		if (fs.existsSync(configCustomFilePath)) {
			configCustomJSON = fs.readFileSync(configCustomFilePath, 'utf8');
		}
	} else {
		// Look for custom configuration file in current directory
		configCustomFilePath = path.resolve(process.env.PWD, 'reactgenerator.json');
		console.log('Trying to look for configCustomFilePath if available : ', configCustomFilePath);

		if (fs.existsSync(configCustomFilePath)) {
			configCustomJSON = fs.readFileSync(configCustomFilePath, 'utf8');
		}
	}

	configCustomJSON = JSON.parse(configCustomJSON);
	// console.log('configCustomJSON: ', configCustomJSON);

	// Custom Function to return value of a node either default or from custom config file.
	function getNodeValue(property) {
		return getValue(configCustomJSON, property) || getValue(configDefaultJSON, property);
	}

	return {
		getNodeValue: getNodeValue
	}
}());

module.exports = configManager;
