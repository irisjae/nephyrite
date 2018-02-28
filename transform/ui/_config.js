var R = require ('ramda');
var Oo = require ('o-o-o-o-o') .Oo;
var o = require ('o-o-o-o-o') .o;

var path = require ('path');





var root_path = Oo (require ('child_process') .execSync ('git rev-parse --show-toplevel') .toString (), o (R .split ('\n')), o (R .head));
var under_root = R .map (R .cond ([
	[R .is (String), x => path .join (root_path, x)],
	[R .is (Object), under_root]
]));

module .exports = {
	paths: under_root ({
		src: '/src',
		dist: '/dist',
		primary: {
			src: '/src/hci/$.html',
			dist: '/dist/hci/index.html'
		},
		assets: {
			src: '/src/hci/assets',
			dist: '/dist/hci/assets'
		},
		frames: {
			src: '/src/hci/frames'
		},
		uis: {
			src: '/src/hci/uis',
			dist: '/dist/hci/scripts/uis.js',
			hydrators_dist: '/dist/hci/scripts/uis-hydrators.js',
			assets_dist: '/dist/hci/assets/liquefied'
		},
		scripts: {
			src: '/src/hci/scripts',
			dist: '/dist/hci/scripts'
		},
		styles: {
			src: '/src/hci/styles',
			dist: '/dist/hci/styles/styles.css',
			
			cache: '/temp/styles/cache',
			copy: '/temp/styles/copy'
		}
	})
}
