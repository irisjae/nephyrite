var fs = require ('fs-extra')
var prepare = require ('__/util') .prepare

var ui_paths = require ('__/config') .paths
					
~ prepare (ui_paths .$ .build);
~ fs .symlinkSync (ui_paths .$ .src, ui_paths .$ .build);
