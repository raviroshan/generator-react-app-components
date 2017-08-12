'use strict';
var fs = require('fs');
var inquirer = require('inquirer');
const path = require('path');
const fse = require('fs-extra')

var stringUtils = require('./utils/string-utils');
var writeFileToFolder = require('./utils/write-file');
var configManager = require('./utils/config-manager');

var globalParams = {
	version: '1.0.0',
	author: 'Ravi Roshan',
	emailId: 'raviroshan.talk@gmail.com',
	website: 'www.raviroshan.info'
};

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
	// srcPath = path.resolve(__dirname, 'templates') + '/' + srcPath;
	// var newSrcPath = path.resolve(__dirname, srcPath);
	// var newDestinationPath = path.resolve(__dirname, destinationPath);
	console.log('>>>> : >> : srcPath : ', srcPath);
	console.log('>>>> : >> : destPath : ', destPath);
	fs.readFile(srcPath, 'utf8', function(err, data) {
		if (err) {
			return console.log('Error Occured in file Read operation : ', err);
		} else {
			var generatedData = replacePlaceHolderWithParams(data, params);
			// writeFileToFolder(destPath, generatedData);
			fse.outputFile(destPath, generatedData)
			.then(data => {
				console.log('Output File generated : ', destPath);
			})
			.catch(err => {
			console.error(err)
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

	console.log('>>> isPage : ', derivedAnswer.isPage);
	console.log('>>> Component : ', derivedAnswer.componentName);
	console.log('>>> Folder : ', derivedAnswer.folderName);
	console.log('>>> CSS Class : ', derivedAnswer.cssClassName);
	console.log('>>> Path : ', derivedAnswer.cmpPath);

	return derivedAnswer;
}

function generateFiles(derivedAnswer) {
	var srcFile;
	if (!!derivedAnswer.isStateLess) {
		srcFile = configManager.getNodeValue('componentStateLess.origin');
	} else {
		srcFile = configManager.getNodeValue('componentStateFull.origin');
	}

	var rootTemplateDirectory;
	var templateFolderPath = path.resolve(process.env.PWD, configManager.getNodeValue('rootSourceFolder'));

	// Promise usage:
	fse.pathExists(templateFolderPath)
  	.then(exists => {
		console.log('exists : ', exists);
		if(exists) {
			rootTemplateDirectory = process.env.PWD;
		} else {
			rootTemplateDirectory = __dirname;
		}

		return rootTemplateDirectory;
	})
	.then(rootTemplateDirectory => {

		// Copy Component
		copyTpl(
			path.resolve(rootTemplateDirectory,
						configManager.getNodeValue('rootSourceFolder'),
						srcFile),
			path.resolve(process.env.PWD,
						configManager.getNodeValue('rootDestFolder'),
						!!derivedAnswer.isPage ?
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
						configManager.getNodeValue('rootSourceFolder') ,
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
						derivedAnswer.componentName  + 'Actions.js'),
			);

			copyTpl(
				path.resolve(rootTemplateDirectory,
							configManager.getNodeValue('rootSourceFolder'),
							configManager.getNodeValue('reducer.origin')),
				path.resolve(process.env.PWD,
						configManager.getNodeValue('rootDestFolder'),
						configManager.getNodeValue('reducer.target'),
						derivedAnswer.componentName  + 'Reducer.js'),
				{
					reducerName: derivedAnswer.folderName + 'Reducer'
				}
			);

			// fs.stat('src/app/reducers/index.js', function(err, stat) {
			// 	if (err == null) {
			// 		// index reducer already exist
			// 		fs.appendFile(
			// 			'src/app/reducers/index.js',
			// 			'\nexport {default as ' + derivedAnswer.folderName + '} from \'.\/' + derivedAnswer.componentName + 'Reducer\';',
			// 			function(err) {
			// 				if (!!err) {
			// 					console.log('Error Occured in file Append operation : ', err);
			// 				}
			// 			}
			// 		);
			// 	} else if (err.code == 'ENOENT') {
			// 		// index reducer does not exist
			// 		writeFileToFolder(
			// 			'src/app/reducers/index.js',
			// 			'export {default as ' + derivedAnswer.folderName + '} from \'.\/' + derivedAnswer.componentName + 'Reducer\';'
			// 		);
			// 	} else {
			// 		console.log('Unknown Error Occured : ', err.code);
			// 	}
			// });
		}

	})






	return derivedAnswer;
}

function main() {
	inquirer.prompt(questions)
		.then(deriveAnswersFromPrompt)
		.then(generateFiles);
}

module.exports = main;
