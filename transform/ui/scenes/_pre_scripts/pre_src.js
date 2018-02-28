//var R = require ('ramda');
var Oo = require ('o-o-o-o-o') .Oo;
var o = require ('o-o-o-o-o') .o;
var oO = require ('o-o-o-o-o') .oO;
var path = require ('path');

var frames_src = require ('./_config') .paths .frames .src;
var file = require ('./_util') .file;
var files = require ('./_util') .files;

var frame_path = function (x) {
	return path .join (frames_src, x + '.svg');
};
var frame_string = function (x) {
	return file (frame_path (x));
}					


var frame = function (x) {
	return _frame (frame_path (x));
};
//recitify and strip_images are specified by closure; before they are not yet defined as of now it appears
//should be fixed when we add module structure
var _frame = Oo (R .__,
	o (x => /*time ('parse ' + x, () =>*/ frag (file (x))/*)*/ .children [0]),
	o (R .tap (x => recitify (x))),
	o (R .tap (x => strip_images (x)))
	//uniqify (x);
	//console .log (x .outerHTML)
);

var frame_set = Oo (R .__,
	o (x => files ('.svg') (path .join (frames_src, x))),
	o (R .map (_frame))
);

