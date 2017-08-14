'use strict';
var fs = require('fs');
var inquirer = require('inquirer');
const path = require('path');
const fse = require('fs-extra');
const chalk = require('chalk');
var eol = require('eol');

var stringUtils = require('./utils/string-utils');
var configManager = require('./utils/config-manager');

var globalParamsFromConfigDefault = configManager.getNodeValue('globalParams', configManager.configDefaultJSON);
// console.log('globalParamsFromConfigDefault: ', globalParamsFromConfigDefault);

var globalParamsFromConfigCustom = configManager.getNodeValue('globalParams', configManager.configCustomJSON);
// console.log('globalParamsFromConfigCustom: ', globalParamsFromConfigCustom);

var globalParams = Object.assign(globalParamsFromConfigDefault, globalParamsFromConfigCustom);
console.log('>>> globalParams : ', globalParams);

function replacePlaceHolderWithParams(data, params) {
	if (typeof params !== 'undefined') {
		// if keys in globalParams and params object is matches,
		// then the params value will override the globalParams
		// Else will add the keys in globalParams
		var finalParamObj = Object.assign(globalParams, params);
	}

	for (var key in finalParamObj) {
		if (finalParamObj.hasOwnProperty(key)) {
			var replaceKeyword = '{' + key + '}';
			var replaceValue = finalParamObj[key];
			data = stringUtils.replaceAll(data, replaceKeyword, replaceValue);
		}
	}

	return data;
}

function copyTpl(srcPath, destPath, params) {
	// console.log('>>>> : >> : srcPath : ', srcPath);
	// console.log('>>>> : >> : destPath : ', destPath);

	fs.readFile(srcPath, 'utf8', function (err, data) {
		if (err) {
			return console.log(chalk.red('Error Occured in file Read operation : ', err));
		} else {
			var generatedData = replacePlaceHolderWithParams(data, params);
			fse.outputFile(destPath, generatedData)
				.then(data => {
					console.log(chalk.green.bold('Output File generated : ') + chalk.blue(destPath));
				})
				.catch(err => {
					console.error(chalk.red(err));
				})
		}
	});
}

var questions = [{
		type: 'input',
		name: 'isPage',
		message: 'Is it a Super Container like a Page?',
		default: 'No'
	},
	{
		type: 'input',
		name: 'isStateLess',
		message: 'Is it a Stateless component?',
		default: 'No'
	},
	{
		type: 'input',
		name: 'cmpName',
		message: 'Enter your Component name [eg : MiniCart]',
		default: 'MiniCart'
	},
	{
		type: 'input',
		name: 'cmpPath',
		message: 'Enter nested path [without first and last "/" ] - if applicable',
		default: ''
	}
];

function deriveAnswersFromPrompt(answers) {
	var derivedAnswer = {};
	derivedAnswer.isPage = (answers.isPage.toLowerCase() === 'yes' || answers.isPage.toLowerCase() === 'y');
	derivedAnswer.isStateLess = (answers.isStateLess.toLowerCase() === 'yes' || answers.isStateLess.toLowerCase() === 'y');
	derivedAnswer.componentName = stringUtils.upperCaseFirstLetter(answers.cmpName);
	derivedAnswer.cmpPath = !!answers.cmpPath ? (answers.cmpPath + '/') : (answers.cmpPath);

	derivedAnswer.folderName = stringUtils.lowerCaseFirstLetter(derivedAnswer.componentName);
	derivedAnswer.cssClassName = stringUtils.toCssClassName(derivedAnswer.componentName);

	derivedAnswer.pageOrComponent = (!!derivedAnswer.isPage) ? 'pages' : 'components';

	// console.log('>>> isPage : ', derivedAnswer.isPage);
	// console.log('>>> Component : ', derivedAnswer.componentName);
	// console.log('>>> Folder : ', derivedAnswer.folderName);
	// console.log('>>> CSS Class : ', derivedAnswer.cssClassName);
	// console.log('>>> Path : ', derivedAnswer.cmpPath);

	return derivedAnswer;
}

function generateFiles(derivedAnswer) {
	var srcFile;
	if (!!derivedAnswer.isStateLess) {
		srcFile = configManager.getNodeValue('componentStateLess.origin');
	} else {
		srcFile = configManager.getNodeValue('componentStateFull.origin');
	}

	// Check if the Template folder exist in the current Directory, then start treating it as SRC root else
	// Take Package Root template as SRC root
	const templateFolderPath = path.resolve(process.env.PWD, configManager.getNodeValue('rootSourceFolder'));
	const rootTemplateDirectory = fse.pathExistsSync(templateFolderPath) ? process.env.PWD : __dirname;

	// Copy Component
	copyTpl(
		path.resolve(rootTemplateDirectory,
			configManager.getNodeValue('rootSourceFolder'),
			srcFile),
		path.resolve(process.env.PWD,
			configManager.getNodeValue('rootDestFolder'), !!derivedAnswer.isPage ?
			configManager.getNodeValue('pages.target') :
			configManager.getNodeValue('componentStateFull.target'),
			derivedAnswer.cmpPath,
			derivedAnswer.folderName,
			derivedAnswer.componentName + configManager.getNodeValue('reactFileExtension')),
		{
			componentName: derivedAnswer.componentName,
			cssClassName: derivedAnswer.cssClassName
		}
	);

	// Copy Stylesheet
	copyTpl(
		path.resolve(rootTemplateDirectory,
			configManager.getNodeValue('rootSourceFolder'),
			configManager.getNodeValue('style.origin')),
		path.resolve(process.env.PWD,
			configManager.getNodeValue('rootDestFolder'),
			configManager.getNodeValue('style.target'),
			derivedAnswer.pageOrComponent,
			derivedAnswer.cmpPath,
			derivedAnswer.folderName,
			derivedAnswer.componentName + configManager.getNodeValue('styleFileExtension')),
		{
			cssClassName: derivedAnswer.cssClassName
		}
	);

	//If it is a Page - Generate a Action Creator and Reducer
	if (!!derivedAnswer.isPage) {
		copyTpl(
			path.resolve(rootTemplateDirectory,
				configManager.getNodeValue('rootSourceFolder'),
				configManager.getNodeValue('action.origin')),
			path.resolve(process.env.PWD,
				configManager.getNodeValue('rootDestFolder'),
				configManager.getNodeValue('action.target'),
				derivedAnswer.componentName + 'Actions.js')
		);

		copyTpl(
			path.resolve(rootTemplateDirectory,
				configManager.getNodeValue('rootSourceFolder'),
				configManager.getNodeValue('reducer.origin')),
			path.resolve(process.env.PWD,
				configManager.getNodeValue('rootDestFolder'),
				configManager.getNodeValue('reducer.target'),
				derivedAnswer.componentName + 'Reducer.js'),
			{
				reducerName: derivedAnswer.folderName + 'Reducer'
			}
		);

		var combinedReducerContent;
		var combinedReducerDestFilePath = path.resolve(process.env.PWD,
													configManager.getNodeValue('rootDestFolder'),
													configManager.getNodeValue('reducer.combinedReducer'))+'.js';

		const appendLine = eol.after('export {default as ' + derivedAnswer.folderName + '} from \'.\/' + derivedAnswer.componentName + 'Reducer\';');

		fs.readFile(combinedReducerDestFilePath, 'utf8', function (err, data) {
			if (err) {
				// console.log('Expected -- Error Occured in file Read operation : ', err);
				combinedReducerContent = appendLine;
			} else {
				combinedReducerContent = data + appendLine;
			}
			fse.outputFile(combinedReducerDestFilePath, combinedReducerContent)
					.then(data => {
						console.log(chalk.green.bold('Output File generated : ') + chalk.blue(combinedReducerDestFilePath));
					})
					.catch(err => {
						console.error(chalk.red(err));
					})
		});
	}
	return derivedAnswer;
}

function main() {
	inquirer.prompt(questions)
		.then(deriveAnswersFromPrompt)
		.then(generateFiles);
}

module.exports = main;