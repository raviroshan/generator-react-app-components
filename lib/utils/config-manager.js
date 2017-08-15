'use strict';
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

var getValue = require('object-getvalue');
var argv = require('minimist')(process.argv.slice(2));

const configManager = (function () {

	const currentDir = process.env.PWD ? process.env.PWD : process.cwd();

	// console.log('process : ', process);
	// console.log('currentDir : ', currentDir);
	// console.log('__dirname : ', __dirname);

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

	// Look for custom configuration file at --config path
	// OR
	// reactgenerator.json in current directory
	var configCustomFilePath = path.resolve(currentDir, (argv.config || 'reactgenerator.json'));
	var configCustomJSON = '{}';

	if (fs.existsSync(configCustomFilePath)) {
		configCustomJSON = fs.readFileSync(configCustomFilePath, 'utf8');
		console.log('--config'+chalk.green.bold(' [Custom] : ') + configCustomFilePath);
	} else {
		console.log('--config'+chalk.green.bold(' [Default] : ') + configDefaultFilePath);
	}

	configCustomJSON = JSON.parse(configCustomJSON);
	// console.log('configCustomJSON: ', configCustomJSON);

	// Custom Function to return value of a node either default or from custom config file.
	function getNodeValue(property, obj1, obj2) {
		obj1 = obj1 || configCustomJSON;
		obj2 = obj2 || configDefaultJSON;
		return getValue(obj1, property) || getValue(obj2, property);
	}

	return {
		currentDir: currentDir,
		getNodeValue: getNodeValue,
		configCustomJSON: configCustomJSON,
		configDefaultJSON: configDefaultJSON
	}
}());

module.exports = configManager;
