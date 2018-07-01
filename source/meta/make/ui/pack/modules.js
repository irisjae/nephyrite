var R = require ('ramda')
var Oo = require ('o-o-o-o-o') .Oo
var o = require ('o-o-o-o-o') .o

var fs = require ('fs-extra')
var path = require ('path')

var ui_paths = require ('__/config') .paths

var prepare = require ('__/utils') .prepare



;; prepare (ui_paths .dist)

;; fs .symlinkSync (R .head (module .paths), ui_paths .dist)
