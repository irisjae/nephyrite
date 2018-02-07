var path = require ('path');

var package_root = require ('get-root-path') .rootPath;
var src__hci = path .join (package_root, '/src/hci');
var dist__build__hci = path .join (package_root, '/dist/build/hci');

module .exports = {
	paths: {
		src: src__hci,
		dist: dist__build__hci,
		primary: {
			src: path .join (src__hci, '/$.html'),
			dist: path .join (dist__build__hci, '/index.html')
		},
		assets: {
			src: path .join (src__hci, '/assets'),
			dist: path .join (dist__build__hci, '/assets')
		},
		frames: {
			src: path .join (src__hci, '/frames')
		},
		uis: {
			src: path .join (src__hci, '/uis'),
			dist: path .join (dist__build__hci, '/scripts/uis.js'),
			hydrators_dist: path .join (dist__build__hci, '/scripts/uis-hydrators.js'),
			assets_dist: path .join (dist__build__hci, '/assets/liquefied')
		},
		scripts: {
			src: path .join (src__hci, '/scripts'),
			dist: path .join (dist__build__hci, '/scripts')
		},
		pages: {
			//src: path .join (src__hci, '/uis')
		},
		riots: {
			src: path .join (src__hci, '/riots'),
			dist: path .join (dist__build__hci, '/scripts/riots.js'),
			strs_dist: path .join (dist__build__hci, '/scripts/riots-strs.js')
		},
		styles: {
			src: path .join (src__hci, '/styles'),
			dist: path .join (dist__build__hci, '/styles/styles.css'),
			
			cache: path .join (package_root, '/temp/styles/cache'),
			copy: path .join (package_root, '/temp/styles/copy')
		}
	}
}
