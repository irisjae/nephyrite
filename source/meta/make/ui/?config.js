var R = require ('ramda')
var Oo = require ('o-o-o-o-o') .Oo
var o = require ('o-o-o-o-o') .o

var path = require ('path')

var sh = x =>
	require ('child_process') .execSync (x) .toString ()




var root_path = Oo (sh ('cd ' + __dirname + '; git rev-parse --show-toplevel'), o (R .split ('\n')), o (R .head))
var under_root = R .map (R .cond ([
	[R .is (String), x => path .join (root_path, x)],
	[R .is (Object), x => under_root (x)]
]))


module .exports = {
	paths: under_root ({
		src : '/src/ui/',
		build : '/dist/ui-build/',
		dist : '/dist/ui/',
		$ : {
			src : '/src/ui/$/$.html',
			build : '/dist/ui-build/$/$.html',
			dist : '/dist/ui/index.html'
		},
		assets : {
			src : '/src/ui/assets/',
			build : '/dist/ui-build/assets/',
			dist : '/dist/ui/assets/'
		},
		frames : {
			src : '/src/ui/frames/'
		},
		scenes : {
			src : '/src/ui/scenes/',

			build : '/dist/ui-build/scenes/',
			hydrators_build : '/dist/ui-build/scripts/scenes-hydrators.js',
			assets_build : '/dist/ui-build/assets/liquefied/',
			automation_cache : '/temp/automation/cache/'
		},
		scripts : {
			src : '/src/ui/scripts/',
			build : '/dist/ui-build/scripts/',
			dist : '/dist/ui/scripts/'
		},
		styles : {
			src : '/src/ui/styles/',

			build : '/dist/ui-build/styles/styles.css',
			cache : '/temp/styles/cache/',
			copy : '/temp/styles/copy/',

			dist : '/dist/ui/styles/styles.css'
		}
	})
}
