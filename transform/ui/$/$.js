//constants
var Oo = require ('o-o-o-o-o') .Oo;
var o = require ('o-o-o-o-o') .o;
var oO = require ('o-o-o-o-o') .oO;
var R = require ('ramda');
var path = require ('path');


var ui_paths = require ('./_config') .paths; 



//utils
var fs = require ('fs-extra');
var child_process = require ('child_process');
var time = require ('./_util') .time;
var file = require ('./_util') .file;
var files = require ('./_util') .files;
var write = require ('./_util') .write;
var prepare = require ('./_util') .prepare;

var scenes = require ('./_scenes');
var styles = require ('./_styles');
					
					
					


//build
time ('build', () => {
	fs .removeSync (ui_paths .dist);
	[
		ui_paths .primary .dist,
		ui_paths .scenes .dist,
		ui_paths .scenes .hydrators_dist,
		ui_paths .scenes .assets_dist,
		ui_paths .scripts .dist,
		ui_paths .styles .dist,
		ui_paths .assets .dist
	]
		.forEach (prepare);

	fs .copySync (ui_paths .primary .src, ui_paths .primary .dist);
	
	Oo (files ('.js') (ui_paths .scenes .src), 
		o (R .map (x => ({
			_path: x,
			contents: file (x)
		}))),
		o (R .map (function (x) {
			var relative_path = x ._path .slice (ui_paths .scenes .src .length + 1);
			var name = R .head (
				relative_path
					.split ('/') .join ('_')
					.split ('.')
			);
										
			return time ('preprocessing ' + name, function () {
				return scenes .process (x .contents);
			})
		})),
		o (R .map (src src + ';\n')),
		o (R .reduce ((sum, next) => sum + next, '')),
		oO ((x) => {
			write (ui_paths .scenes .dist) (x);
			write (ui_paths .scenes .hydrators_dist) (time ('serializing hydrators', scenes .hydration));
			Oo (scenes .assets,
				oO (R .addIndex (R .forEach) ((x, i) => {
					fs .writeFileSync (path .join (ui_paths .scenes .assets_dist, i + '.' + x .type), x .data);
				})))
		}));

	Oo (R .concat (files ('.css') (ui_paths .styles .src), files ('.scss') (ui_paths .styles .src)), 
		o (R .map (R .applySpec ({
			_path: R .identity,
			contents: file
		}))),
		o (R .map (function (_) {
			return {
				names: [R .head (R .last (_ ._path .split ('/')) .split ('.'))],
				path: _ ._path .slice (ui_paths .styles .src .length + 1),
				dependencies: [],
				metastyles: _ .contents
			}
		})),
		o (function (build_nodes) {
			var tree = styles .weave (build_nodes);
	
			styles .invalidate ()
			var answer = styles .grow (tree);
			styles .clean ();
	
			return answer 
		}),
		o (R .chain (function (branch) {
			//console .log ('debug: ' + JSON .stringify (R .omit (['styles', 'metastyles']) (branch), null, 4));
			return branch .path === '*' ?
				[branch .styles]
			:
				[];
		})),
		o (R .tap (function (branches) {
			if (branches .length !== 1)
				throw 'can\'t find answer' + '\n\n' + '\n' +
					'branches length is ' + branches .length  
		})),
		o (R .head),
		oO (write (ui_paths .styles .dist));

	Oo (files ('.js') (ui_paths .scripts .src), 
		oO (R .forEach (function (_path) {
			var name = R .last (_path .split ('/'));
			var dest_path = path .join (ui_paths .scripts .dist, name);
			fs .symlinkSync (_path, dest_path);
		})));

	Oo (files ('') (ui_paths .assets .src),
		oO (R .forEach (function (_path/* of file*/) {
			var name = _path .slice (ui_paths .assets .src .length + 1);
			var dest_path = path .join (ui_paths .assets .dist, name);
			fs .ensureDirSync (dest_path .split ('/') .slice (0, -1) .join ('/'));
			//prepare (dest_path);
			fs .symlinkSync (_path, dest_path);
		})));

});
