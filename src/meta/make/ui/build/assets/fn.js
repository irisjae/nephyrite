var Oo = require ('o-o-o-o-o') .Oo
var o = require ('o-o-o-o-o') .o
var oO = require ('o-o-o-o-o') .oO
var R = require ('ramda')

var path = require ('path')
var fs = require ('fs-extra')
var files = require ('__/util') .files
var prepare = require ('__/util') .prepare

var ui_paths = require ('__/config') .paths 

{;prepare (ui_paths .assets .build)}

{;Oo (files ('') (ui_paths .assets .src),
	oO (R .forEach (src/* of file*/ => {
		var name = src .slice (ui_paths .assets .src .length)
		var dest = path .join (ui_paths .assets .build, name)

		;; fs .ensureDirSync (dest .split ('/') .slice (0, -1) .join ('/'))
		//commented out because misdetects unextensioned files
		//prepare (dest);
		;; fs .symlinkSync (src, dest)
	})))}
