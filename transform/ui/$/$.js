//constants
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

var riot_tags = require ('./_riots');
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
		ui_paths .riots .dist,
		ui_paths .riots .strs_dist,
		ui_paths .styles .dist,
		ui_paths .assets .dist
	]
		.forEach (prepare);

	fs .copySync (ui_paths .primary .src, ui_paths .primary .dist);
	
	[files ('.js') (ui_paths .scenes .src)] 
		.map (R .map (R .applySpec ({
			_path: R .identity,
			contents: file
		})))
		.map (R .map (function (_) {
			var relative_path = _ ._path .slice (ui_paths .scenes .src .length + 1);
			var name = R .head (
				relative_path
					.split ('/') .join ('_')
					.split ('.')
			);
										
			return time ('preprocessing ' + name, function () {
				return scenes .process (_ .contents);
			})
		}))
		.map (R .map (function (src) {
			return src + ';\n'
		}))
		.map (R .reduce (function (sum, next) {
			 return sum + next; 
		}, ''))
		.forEach (function (_) {
			write (ui_paths .scenes .dist) (_);
			write (ui_paths .scenes .hydrators_dist) (time ('serializing hydrators', scenes .hydration));
			[scenes .assets]
				.forEach (R .addIndex (R .forEach) (function (x, i) {
					fs .writeFileSync (path .join (ui_paths .scenes .assets_dist, i + '.' + x .type), x .data);
				}))
		});

	[files ('.ejs') (ui_paths .riots .src)]
		.map (R .map (R .applySpec ({
			_path: R .identity,
			contents: file
		})))
		.map (R .map (function (_) {
			var tag_relative_path = _ ._path .slice (ui_paths .riots .src .length + 1);
			var tag_name =	R .head (
								tag_relative_path
									.split ('/') .join ('-')
									.split ('.')
							);
			return R .merge (_, {
				name: tag_name
			});
		}))
		.map (R .tap (R .forEach (function (_) {
			R .uniq ([_ .name, R .last (_ .name .split ('-'))])
				.forEach (function (name) {
					if (! riot_tags .name_resolution [name]) riot_tags .name_resolution [name] = [];
					riot_tags .name_resolution [name] .push (path)
				})
		})))
		.map (R .map (function (_) {
			return time ('parsing ' + _ .name, function () {
				return riot_tags .parse (_ .contents, _ .name);
			})
		}))
		//.map (R .values)
		.map (R .reduce (function (sum, next) { return sum + next; }, ''))
		.map (function (x) {
			return time ('compiling', function () {
				return riot_tags .compile (x);
			})
		})
		.map (function (x) {
			return time ('stripping long strings', function () {
				return riot_tags .strip_long_strings (x);
			})
		})
		.forEach (function (riot_scripts) {
			var _ = riot_scripts .src;
			var strings = riot_scripts .strs;
			
			write (ui_paths .riots .dist) (_);
			write (ui_paths .riots .strs_dist) (strings);
		});

	[
		function (_) {
			return R .concat (_ .scss_seeds, _ .riot_style_seeds);
		} ({
			scss_seeds: [R .concat (files ('.css') (ui_paths .styles .src), files ('.scss') (ui_paths .styles .src))] 
				.map (R .map (R .applySpec ({
					_path: R .identity,
					contents: file
				})))
				.map (R .map (function (_) {
					return {
						names: [R .head (R .last (_ ._path .split ('/')) .split ('.'))],
						path: _ ._path .slice (ui_paths .styles .src .length + 1),
						dependencies: [],
						metastyles: _ .contents
					}
				})) [0],
			riot_style_seeds: [riot_tags .metastyles_resolution] 
				.map (R .keys)
				.map (R .map (function (name) {
					return {
						names: R .uniq ([name, R .last (name .split ('-'))]),
						path: name,
						dependencies: [],
						metastyles: [(riot_tags .metastyles_resolution [name] || []) .join ('\n')]
							/* implements custom selector */
							.map (function (def) {
								return def .replace (/-> ?{([^}]+)}/g, ' $1');//:not(& $1 $1)');
							})
							.map (function (def) {
								/*return	tag + ',[data-is="' + tag + '"] {' + '\n' +*/
								return	name + ' {' + '\n' +
											def + '\n' +
										'}';
							}) [0]
					};
				})) [0]
		})
	]
		.map (function (build_nodes) {
			var tree = styles .weave (build_nodes);
	
			styles .invalidate ()
			var answer = styles .grow (tree);
			styles .clean ();
	
			return answer 
		})
		.map (R .chain (function (branch) {
			//console .log ('debug: ' + JSON .stringify (R .omit (['styles', 'metastyles']) (branch), null, 4));
			return branch .path === '*' ?
				[branch .styles]
			:
				[];
		}))
		.map (R .tap (function (branches) {
			if (branches .length !== 1)
				throw 'can\'t find answer' + '\n\n' + '\n' +
					'branches length is ' + branches .length  
		}))
		.map (R .head)
		.forEach (write (ui_paths .styles .dist));

	[files ('.js') (ui_paths .scripts .src)] 
		.forEach (R .forEach (function (_path) {
			var name = R .last (_path .split ('/'));
			var dest_path = path .join (ui_paths .scripts .dist, name);
			fs .symlinkSync (_path, dest_path);
		}));

	[files ('') (ui_paths .assets .src)]
		.forEach (R .forEach (function (_path/* of file*/) {
			var name = _path .slice (ui_paths .assets .src .length + 1);
			var dest_path = path .join (ui_paths .assets .dist, name);
			fs .ensureDirSync (dest_path .split ('/') .slice (0, -1) .join ('/'));
			//prepare (dest_path);
			fs .symlinkSync (_path, dest_path);
		}));

});
