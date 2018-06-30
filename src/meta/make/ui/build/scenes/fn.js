var Oo = require ('o-o-o-o-o') .Oo
var o = require ('o-o-o-o-o') .o
var oO = require ('o-o-o-o-o') .oO
var R = require ('ramda')


var ui_paths = require ('__/config') .paths 


var path = require ('path')
var fs = require ('fs-extra')
var time = require ('__/util') .time
var file = require ('__/util') .file
var files = require ('__/util') .files
var write = require ('__/util') .write
var prepare = require ('__/util') .prepare

var scenes = require ('./scenes')
var auto = require ('./auto')


;; [ ui_paths .scenes .build
	, ui_paths .scenes .hydrators_build
	, ui_paths .scenes .assets_build
] .forEach (prepare)

//TODO: add transform browserify
;; Oo (files ('.js') (ui_paths .scenes .src), 
	o (R .map (x => ({
		src_path: x,
		contents: file (x)
	}))),
	o (R .map (x => {
		var relative_path = x .src_path .slice (ui_paths .scenes .src .length)
		var name = Oo (relative_path,
			o (R .split ('/')),
			o (R .join ('_')),
			o (R .split ('.')),
			o (R .head))
									
		return R .merge (x, {
			processed_path: path .join (ui_paths .scenes .build, name + '.js'),
			processed: time ('building ' + name, () =>
				scenes (x .src_path, x .contents)
			)
		})
	})),
	oO (R .map (x => {
		;; write (x .processed_path) (x .processed)
	})))
;; Oo (auto .js_dehydration .rehydrators,
	o (x => JSON .stringify (x)),
	oO (x => {
		;; write (ui_paths .scenes .hydrators_build) (x)
	}))
;; Oo (auto .image_url_dehydration .rehydrators,
	o (R .toPairs),
	oO (R .forEach (x => {
		var data = x [0] .data
		var type = x [0] .type
		var i = x [1]
		var filename = i + '.' + type

		;; fs .writeFileSync (path .join (ui_paths .scenes .assets_build, filename), data)
	})))
