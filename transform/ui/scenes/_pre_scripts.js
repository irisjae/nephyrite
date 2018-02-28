var R = require ('ramda');
var files = require ('./_util') .files;
var file = require ('./_util') .file;

module .exports = [files ('.js') (__dirname + '/_pre_scripts')]
	.map (R .map (file)) 
	.map (R .map (function (src) {
	    return src + ';\n'
	}))
	.map (R .reduce (function (sum, next) {
		 return sum + next; 
	}, ''))
[0];
