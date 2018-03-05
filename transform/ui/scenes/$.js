//constants
var Oo = require ('o-o-o-o-o') .Oo;
var o = require ('o-o-o-o-o') .o;
var oO = require ('o-o-o-o-o') .oO;
var R = require ('ramda');
var path = require ('path');


var ui_paths = require ('./_config') .paths; 



//utils
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

Oo (files ('.js') (ui_paths .scenes .src), 
	o (R .map (x => ({
		_path: x,
		contents: file (x)
	}))),
	o (R .map (x => {
		var relative_path = x ._path .slice (ui_paths .scenes .src .length + 1);
		var name = R .head (
			relative_path
			.split ('/') .join ('_')
			.split ('.')
		);
									
		return time ('preprocessing ' + name, () =>
			scenes (x ._path, x .contents)
		)
	})),
	//o (R .map (src => src + ';\n')),
	//o (R .reduce ((sum, next) => sum + next, '')),
	//TODO: replace with browserify
	oO (x => {
		write (ui_paths .scenes .dist) (x);
		//Oo (auto .js_dehydration,
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
	}));

