var R = require ('ramda');
var Oo = require ('o-o-o-o-o') .Oo;
var o = require ('o-o-o-o-o') .o;
var oO = require ('o-o-o-o-o') .oO;
var path = require ('path');

var file = require ('../util') .file;
var files = require ('../util') .files;

var frag = require ('./automate/tree_utils') .frag;
var recitify = require ('./automate/tree_transforms') .recitify;
var strip_images = require ('./automate/strip_images');



module .exports = (frames_src, liquefy) => {
	var frame_path = x =>
		path .join (frames_src, x + '.svg')
	;
	/*var frame_string = x =>
		file (frame_path (x))
	;*/					


	var _frame = Oo (R .__,
		//o (x => time ('parse ' + x, () => frag (file (x))) .children [0]),
		o (x => frag (file (x)) .children [0]),
		o (R .tap (recitify)),
		o (R .tap (strip_images (liquefy)))
		//uniqify (x);
		//console .log (x .outerHTML)
	);


	var frame = x => _frame (frame_path (x));
	var frame_set = Oo (R .__,
		o (x => files ('.svg') (path .join (frames_src, x))),
		o (R .map (_frame))
	);

	return {
		frame: frame,
		frame_set: frame_set
	}
}
