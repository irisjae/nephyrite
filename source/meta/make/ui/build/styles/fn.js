var { T, Z_, R, from_just, path, fs, link, ext_files, prepare } = require ('./_util')
var { argv } = require ('process')
var styles = require ('./style_tree')

var _source = argv [2]
var _out = argv [3]


;T (_out) (prepare)

var ui_paths = require ('__/config') .paths 

					
					


;; prepare (ui_paths .styles .build)

;; Oo (R .concat (files ('.css') (ui_paths .styles .src), files ('.scss') (ui_paths .styles .src)), 
	o (R .map (x => ({
		_path: x,
		contents: file (x)
	}))),
	o (R .map (x => ({
		names: [ Oo (x ._path, o (R .split ('/')), o (R .last), o (R .split ('.')), o (R .head)) ],
		path: x ._path .slice (ui_paths .styles .src .length),
		dependencies: [],
		metastyles: x .contents
	}))),
	o (function (build_nodes) {
		var tree = styles .weave (build_nodes)

		~ styles .invalidate ();

		var answer = styles .grow (tree)

		~ styles .clean ();

		return answer 
	}),
	o (R .chain (function (branch) {
		//console .log ('debug: ' + JSON .stringify (R .omit (['styles', 'metastyles']) (branch), null, 4));
		return !! (branch .path === '*') ?
			[branch .styles]
		:
			[]
	})),
	o (R .tap (function (branches) {
		if (branches .length !== 1)
			throw 'can\'t find answer' + '\n\n' + '\n' + 'branches length is ' + branches .length  
	})),
	o (R .head),
	oO (write (ui_paths .styles .build)))
