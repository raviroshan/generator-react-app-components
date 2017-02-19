var fs = require('fs');

function _creatFolders(destPath) {
	destPath.split('/').reduce(function(prev, curr, i) {
		if (fs.existsSync(prev) === false) {
			fs.mkdirSync(prev);
		}
		return prev + '/' + curr;
	});
}

function writeFileToFolder(destPath, data) {
	_creatFolders(destPath);
	fs.writeFile(destPath, data, function(err) {
		if (err) {
			return console.log('Error Occured in file Write operation : ', err);
		}
		console.log('Output File generated : ', destPath);
	});
}

module.exports = writeFileToFolder;
