var R = require ('ramda');
var Oo = require ('o-o-o-o-o') .Oo;
var o = require ('o-o-o-o-o') .o;

var path = require ('path');





var root_path = Oo (require ('child_process') .execSync ('cd ' + __dirname + '; git rev-parse --show-toplevel') .toString (),
	o (R .split ('\n')),
	o (R .head));
var under_root = R .map (R .cond ([
	[R .is (String), x => path .join (root_path, x)],
	[R .is (Object), x => under_root (x)]
]));

module .exports = {
	paths: under_root ({
		src: '/src',
		dist: '/dist',
		$: {
			src: '/src/ui/$.html',
			dist: '/dist/ui/index.html'
		},
		assets: {
			src: '/src/ui/assets',
			dist: '/dist/ui/assets'
		},
		frames: {
			src: '/src/ui/frames'
		},
		scenes: {
			src: '/src/ui/scenes',
			dist: '/dist/ui/scenes',
			automation_cache: '/temp/automation/cache',
			hydrators_dist: '/dist/ui/scripts/scenes-hydrators.js',
			assets_dist: '/dist/ui/assets/liquefied'
		},
		scripts: {
			src: '/src/ui/scripts',
			dist: '/dist/ui/scripts'
		},
		styles: {
			src: '/src/ui/styles',
			dist: '/dist/ui/styles/styles.css',
			
			cache: '/temp/styles/cache',
			copy: '/temp/styles/copy'
		}
	})
}
