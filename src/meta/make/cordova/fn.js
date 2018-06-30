var R = require ('ramda');
var fs = require ('fs-extra');
var path = require ('path');

//constants
var package_root = require ('get-root-path') .rootPath;

var dist__cordova__$ = path .join (package_root, '/dist/cordova/$');
var dist__cordova__$__www = path .join (package_root, '/dist/cordova/$/www');

var dist__build__hci = path .join (package_root, '/dist/build/hci');
var src__cordova = path .join (package_root, '/src/cordova');



fs .ensureDirSync (dist__cordova__$);

[fs .readdirSync (dist__cordova__$)]
	.map (R .map (function (buffer) {
		return buffer .toString ()
	}))
	.forEach (R .forEach (function (name) {
		fs .removeSync (path .join (dist__cordova__$, name));
	}));

fs .ensureDirSync (dist__cordova__$__www);

[path .join (dist__build__hci, 'index.html')]
	.map (function (x) {
		return fs .readFileSync (x) .toString ();
	}) 
	.map (function (x) {
		return x .replace (
			'<!-- polyfills -->',
			'<!-- polyfills -->' + '\n' + '<script src="cordova.js"></script>'
		)
	})
	.forEach (function (x) {
		fs .outputFileSync (
			path .join (dist__cordova__$__www, 'index.html'),
			x
		);
	});

[fs .readdirSync (dist__build__hci)]
	.map (R .map (function (buffer) {
		return buffer .toString ()
	}))
	.map (R .filter (function (name) {
		return name !== 'index.html'
	}))
	.forEach (R .forEach (function (name) {
		fs .symlinkSync (
			path .join (dist__build__hci, name),
			path .join (dist__cordova__$__www, name));
	}));

[fs .readdirSync (src__cordova)]
	.map (R .map (function (buffer) {
		return buffer .toString ()
	}))
	.map (R .filter (function (name) {
		return ! name .endsWith ('-ama')
	}))
	.forEach (R .forEach (function (name) {
		fs .removeSync (path .join (dist__cordova__$, name));
		fs .symlinkSync (
			path .join (src__cordova, name), 
			path .join (dist__cordova__$, name));
	}));

