var R = require ('ramda');
var fs = require ('fs-extra');
var path = require ('path');

//constants
var package_root = require ('get-root-path') .rootPath;

var dist__webapp = path .join (package_root, '/dist/webapp');

var dist__build__hci = path .join (package_root, '/dist/build/hci');
var transform__webapp__merges = path .join (package_root, '/transform/webapp/merges');



fs .ensureDirSync (dist__webapp);

[fs .readdirSync (dist__webapp)]
	.forEach (R .forEach (function (name) {
		fs .removeSync (path .join (dist__webapp, name));
	}));
[fs .readdirSync (dist__build__hci)]
	.forEach (R .forEach (function (name) {
		fs .symlinkSync (
			path .join (dist__build__hci, name),
			path .join (dist__webapp, name));
	}));
[fs .readdirSync (transform__webapp__merges)]
	.forEach (R .forEach (function (name) {
		fs .removeSync (path .join (dist__webapp, name));
		fs .symlinkSync (
			path .join (transform__webapp__merges, name), 
			path .join (dist__webapp, name));
	}));

