//constants
var R = require ('ramda');
var path = require ('path');


var config_paths = require ('./_config') .paths; 

var dist = config_paths .dist;
var primary_src = config_paths .primary .src;
var primary_dist = config_paths .primary .dist;
var uis_src = config_paths .uis .src;
var uis_dist = config_paths .uis .dist;
var uis_hydrators_dist = config_paths .uis .hydrators_dist;
var uis_assets_dist = config_paths .uis .assets_dist;
var scripts_src = config_paths .scripts .src;
var scripts_dist = config_paths .scripts .dist;
var riots_src = config_paths .riots .src;
var riots_dist = config_paths .riots .dist;
var riots_strs_dist = config_paths .riots .strs_dist;
var styles_src = config_paths .styles .src;
var styles_dist = config_paths .styles .dist;
var assets_src = config_paths .assets .src;
var assets_dist = config_paths .assets .dist;


//utils
var fs = require ('fs-extra');
var child_process = require ('child_process');
var time = require ('./_util') .time;
var file = require ('./_util') .file;
var files = require ('./_util') .files;
var write = require ('./_util') .write;
var prepare = require ('./_util') .prepare;

var riot_tags = require ('./_riots');
var uis = require ('./_uis');
var styles = require ('./_styles');
					
					
					


//build
time ('build', function () {
	fs .removeSync (dist);
	[
		primary_dist,
		uis_dist,
		uis_hydrators_dist,
		uis_assets_dist,
		scripts_dist,
		riots_dist,
		riots_strs_dist,
		styles_dist,
		assets_dist
	]
		.forEach (prepare);

	fs .copySync (primary_src, primary_dist);
	
	[files ('.js') (uis_src)] 
		.map (R .map (R .applySpec ({
			_path: R .identity,
			contents: file
		})))
		.map (R .map (function (_) {
			var relative_path = _ ._path .slice (uis_src .length + 1);
			var name =	R .head (
							relative_path
								.split ('/') .join ('_')
								.split ('.')
						);
										
			return time ('preprocessing ' + name, function () {
				return uis .process (_ .contents);
			})
		}))
		.map (R .map (function (src) {
		    return src + ';\n'
		}))
		.map (R .reduce (function (sum, next) {
			 return sum + next; 
		}, ''))
		.forEach (function (_) {
			write (uis_dist) (_);
			write (uis_hydrators_dist) (time ('serializing hydrators', uis .hydration));
			[uis .assets]
				.forEach (R .addIndex (R .forEach) (function (x, i) {
					fs .writeFileSync (path .join (uis_assets_dist, i + '.' + x .type), x .data);
				}))
		});

	[files ('.ejs') (riots_src)]
		.map (R .map (R .applySpec ({
			_path: R .identity,
			contents: file
		})))
		.map (R .map (function (_) {
			var tag_relative_path = _ ._path .slice (riots_src .length + 1);
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
			
			write (riots_dist) (_);
			write (riots_strs_dist) (strings);
		});

	[
		function (_) {
			return R .concat (_ .scss_seeds, _ .riot_style_seeds);
		} ({
			scss_seeds: [R .concat (files ('.css') (styles_src), files ('.scss') (styles_src))] 
				.map (R .map (R .applySpec ({
					_path: R .identity,
					contents: file
				})))
				.map (R .map (function (_) {
					return {
						names: [R .head (R .last (_ ._path .split ('/')) .split ('.'))],
						path: _ ._path .slice (styles_src .length + 1),
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
		.forEach (write (styles_dist));

	[files ('.js') (scripts_src)] 
		.forEach (R .forEach (function (_path) {
			var name = R .last (_path .split ('/'));
			var dest_path = path .join (scripts_dist, name);
			fs .symlinkSync (_path, dest_path);
		}));

	[files ('') (assets_src)]
		.forEach (R .forEach (function (_path/* of file*/) {
			var name = _path .slice (assets_src .length + 1);
			var dest_path = path .join (assets_dist, name);
			fs .ensureDirSync (dest_path .split ('/') .slice (0, -1) .join ('/'));
			//prepare (dest_path);
			fs .symlinkSync (_path, dest_path);
		}));

});
