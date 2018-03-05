var Oo = require ('o-o-o-o-o') .Oo;
var o = require ('o-o-o-o-o') .o;
var oO = require ('o-o-o-o-o') .oO;
var R = require ('ramda');

var path = require ('path');
var fs = require ('fs-extra');
var files = require ('../util') .files;
var prepare = require ('../util') .prepare;

var ui_paths = require ('../config') .paths; 

prepare (ui_paths .scripts .dist)

Oo (files ('.js') (ui_paths .scripts .src), 
	oO (R .forEach (function (_path) {
		var name = R .last (_path .split ('/'));
		var dest_path = path .join (ui_paths .scripts .dist, name);
		fs .symlinkSync (_path, dest_path);
	})))
