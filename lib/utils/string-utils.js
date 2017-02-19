'use strict';

var stringUtils = (function() {
	function _upperCaseFirstLetter(string) {
		return string.charAt(0).toUpperCase() + string.slice(1);
	}

	function _lowerCaseFirstLetter(string) {
		return string.charAt(0).toLowerCase() + string.slice(1);
	}

	function _toCssClassName(str) {
		return str.charAt(0).toLowerCase() + str.slice(1).replace(/([A-Z])/g, '-$1').toLowerCase();
	}

	function _replaceAll(str, pattern, newSubStr) {
		return str.replace(new RegExp(pattern, 'g'), newSubStr);
	}

	return {
		upperCaseFirstLetter: _upperCaseFirstLetter,
		lowerCaseFirstLetter: _lowerCaseFirstLetter,
		toCssClassName: _toCssClassName,
		replaceAll: _replaceAll
	};
}());

module.exports = stringUtils;
