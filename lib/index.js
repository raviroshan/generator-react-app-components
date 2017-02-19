'use strict';
var fs = require('fs');
var inquirer = require('inquirer');
const path = require('path');

var stringUtils = require('./utils/string-utils');
var writeFileToFolder = require('./utils/write-file');

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
	srcPath = path.resolve(__dirname, 'templates') + '/' + srcPath;
	// var newSrcPath = path.resolve(__dirname, srcPath);
	// var newDestinationPath = path.resolve(__dirname, destinationPath);
	fs.readFile(srcPath, 'utf8', function(err, data) {
		if (err) {
			return console.log('Error Occured in file Read operation : ', err);
		} else {
			var generatedData = replacePlaceHolderWithParams(data, params);
			writeFileToFolder(destPath, generatedData);
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
		srcFile = 'stateless_component.jsx';
	} else {
		srcFile = 'component.jsx';
	}

	// Copy Component
	copyTpl(
		srcFile,
		'src/app/' + derivedAnswer.pageOrComponent + '/' + derivedAnswer.cmpPath + derivedAnswer.folderName + '/' + derivedAnswer.componentName + '.jsx', {
			componentName: derivedAnswer.componentName,
			cssClassName: derivedAnswer.cssClassName
		}
	);

	// Copy Stylesheet
	copyTpl(
		'component.scss',
		'src/assets/stylesheets/' + derivedAnswer.pageOrComponent + '/' + derivedAnswer.cmpPath + derivedAnswer.folderName + '/' + derivedAnswer.cssClassName + '.scss', {
			cssClassName: derivedAnswer.cssClassName
		}
	);

	//If it is a Page - Generate a Reducer and Action Creator
	if (!!derivedAnswer.isPage) {
		copyTpl(
			'action.js',
			'src/app/actions/' + derivedAnswer.componentName + 'Actions.js'
		);

		copyTpl(
			'reducer.js',
			'src/app/reducers/' + derivedAnswer.componentName + 'Reducer.js', {
				reducerName: derivedAnswer.folderName + 'Reducer'
			}
		);

		fs.stat('src/app/reducers/index.js', function(err, stat) {
			if (err == null) {
				// index reducer already exist
				fs.appendFile(
					'src/app/reducers/index.js',
					'\nexport {default as ' + derivedAnswer.folderName + '} from \'.\/' + derivedAnswer.componentName + 'Reducer\';',
					function(err) {
						if (!!err) {
							console.log('Error Occured in file Append operation : ', err);
						}
					}
				);
			} else if (err.code == 'ENOENT') {
				// index reducer does not exist
				writeFileToFolder(
					'src/app/reducers/index.js',
					'export {default as ' + derivedAnswer.folderName + '} from \'.\/' + derivedAnswer.componentName + 'Reducer\';'
				);
			} else {
				console.log('Unknown Error Occured : ', err.code);
			}
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
