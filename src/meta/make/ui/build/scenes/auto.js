var Oo = require ('o-o-o-o-o') .Oo
var o = require ('o-o-o-o-o') .o
var oO = require ('o-o-o-o-o') .oO
var R = require ('ramda')

var path = require ('path')
var fs = require ('fs-extra')
var prepare = require ('__/util') .prepare
var write = require ('__/util') .write



var config = require ('__/config')

var automate_cache = config .paths .scenes .automation_cache
var assets_dist_url = Oo (o, () => {
	var assets_dist = config .paths .scenes .assets_build
	var ui_dist = R .join ('/') (R .init (R .split ('/') (config .paths .$ .build)))
	
	return assets_dist .slice (ui_dist .length)
})


var js_dehydration = require ('./dehydration') .js_value (i => `window .js_dehydration [${i}]`)
var image_url_dehydration = require ('./dehydration') .image_url (i => assets_dist_url + '/' + i)


;; Oo (automate_cache,
	oO (x => {
		;; fs .ensureDirSync (x)

		;; Oo (fs .readdirSync (x),
			oO (R .forEach (file => {
				;; fs .unlinkSync (path .join (automate_cache, file))
			})))
	}))


var frames = require ('./frame') (config .paths .frames .src, image_url_dehydration .dehydrate)


var surplusify = require ('./automate/surplusify') (js_dehydration .dehydrate)
var responsivify = require ('./automate/responsivify') (surplusify)


var auto = R .mergeAll ([
	{ window : require ('__window') }
	, require ('./automate/tree_utils')
	, require ('./automate/tree_transforms')
	, frames
	, { ____h: surplusify }
	, responsivify
	, require ('./automate/corins')
	, {
		js_dehydration : js_dehydration,
		image_url_dehydration : image_url_dehydration
	}
])

module .exports = auto
