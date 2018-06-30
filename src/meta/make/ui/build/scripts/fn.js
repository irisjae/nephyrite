var Oo = require ('o-o-o-o-o') .Oo
var o = require ('o-o-o-o-o') .o
var oO = require ('o-o-o-o-o') .oO
var R = require ('ramda')

var path = require ('path')
var fs = require ('fs-extra')
var files = require ('__/util') .files
var prepare = require ('__/util') .prepare

var ui_paths = require ('__/config') .paths 

;; prepare (ui_paths .scripts .build)

;; Oo (files ('.js') (ui_paths .scripts .src), 
	oO (R .forEach (src => {
		var name = R .last (src .split ('/'))
		var dest = path .join (ui_paths .scripts .build, name)

		;; fs .symlinkSync (src, dest)
	})))
