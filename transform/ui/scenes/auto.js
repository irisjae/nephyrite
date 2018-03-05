var Oo = require ('o-o-o-o-o') .Oo;
var o = require ('o-o-o-o-o') .o;
var oO = require ('o-o-o-o-o') .oO;
var R = require ('ramda');

var path = require ('path');
var fs = require ('fs-extra');
var prepare = require ('../util') .prepare;
var write = require ('../util') .write;



var config = require ('../config');

var automate_cache = config .paths .scenes .automation_cache;
var assets_dist_url = (_ =>
	_ .assets_dist .slice (_ .ui_dist .length + 1)
)
	({
		assets_dist: config .paths .scenes .assets_dist,
		ui_dist: R .join ('/') (R .init (R .split ('/') (config .paths .$ .dist)))
	});


var js_dehydration = require ('./dehydration') .js_value (i =>
	`window .js_dehydration [${i}]`
);
var image_url_dehydration = require ('./dehydration') .image_url (i =>
	assets_dist_url + '/' + i
);


Oo (automate_cache,
	oO (x => {
		fs .ensureDirSync (x)
		Oo (fs .readdirSync (automate_cache),
			oO (R .forEach (file => {
				fs .unlinkSync (path .join (automate_cache, file))
			})))
	}))


var frames = require ('./frame') (config .paths .frames .src, image_url_dehydration .dehydrate);


var surplusify = require ('./automate/surplusify') (js_dehydration .dehydrate);
var responsivify = require ('./automate/responsivify') (surplusify);


var auto = R .mergeAll ([
	{
		window: require ('__window'),
		eval: (src, file_name, location) => {
			var full_name = (file_name .startsWith (config .paths .scenes .src)) ?
				file_name .slice (config .paths .scenes .src .length + 1)
			:
				file_name
			var proper_name = R .head (R .split ('.') (full_name))
			var extension = R .last (R .split ('.') (full_name))
			var automation_path = path .join (automate_cache,
				proper_name
				+ '_' + location .start .line + ':' + location .start .column 
				+ '-' + location .end .line + ':' + location .end .column
				+ '.' + extension
			);
			prepare (automation_path);
			write (automation_path) (
`module .exports = auto => { with (auto .window) { return (${src}) () }}`
			);
			return js_dehydration .dehydrate (require (automation_path) (auto))
		}
	}
	, require ('./automate/tree_utils')
	, require ('./automate/tree_transforms')
	, frames
	, { ____h: surplusify }
	, responsivify
	, require ('./automate/corins')
	, {
		js_dehydration: js_dehydration,
		image_url_dehydration: image_url_dehydration
	}
]);

module .exports = auto;
