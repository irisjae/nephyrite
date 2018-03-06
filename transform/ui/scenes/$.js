var Oo = require ('o-o-o-o-o') .Oo;
var o = require ('o-o-o-o-o') .o;
var oO = require ('o-o-o-o-o') .oO;
var R = require ('ramda');


var ui_paths = require ('./_config') .paths; 


var path = require ('path');
var fs = require ('fs-extra');
var time = require ('./_util') .time;
var file = require ('./_util') .file;
var files = require ('./_util') .files;
var write = require ('./_util') .write;
var prepare = require ('./_util') .prepare;

var scenes = require ('./scenes');
var auto = require ('./auto');


[
	ui_paths .scenes .dist
	, ui_paths .scenes .hydrators_dist
	, ui_paths .scenes .assets_dist
]
.forEach (prepare);

//TODO: add transform browserify
Oo (files ('.js') (ui_paths .scenes .src), 
	o (R .map (x => ({
		src_path: x,
		contents: file (x)
	}))),
	o (R .map (x => {
		var relative_path = x .src_path .slice (ui_paths .scenes .src .length + 1);
		var name = R .head (
			relative_path
			.split ('/') .join ('_')
			.split ('.')
		);
									
		return R .merge (x, {
			dist_path: path .join (ui_paths .scenes .dist, name),
			processed: time ('preprocessing ' + name, () =>
				scenes (x .src_path, x .contents)
			)
		})
	})),
	oO (x => {
		write (x .dist_path) (x .processed);
	}))
Oo (auto .js_dehydration .rehydrators,
	o (x => 'window .js_dehydration = [' + x .join (',') + '];'),
	oO (x => {
		write (ui_paths .scenes .hydrators_dist) (x)
	}))
Oo (auto .image_url_dehydration .rehydrators,
	o (R .toPairs),
	oO (R .forEach (x => {
		var data = x [0] .data;
		var type = x [0] .type;
		var i = x [1];
		fs .writeFileSync (path .join (ui_paths .scenes .assets_dist, i + '.' + type), data);
	})))
