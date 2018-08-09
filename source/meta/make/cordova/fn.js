var { T, Z_, R, path, fs, read, write, remove, link, child_files, prepare } = require ('./_util')
var { argv } = require ('process')

var _source = argv [2]
var _out = argv [3]

var _source_ui = path .join (_source, '/ui');
var _source_cordova = path .join (_source, '/cordova');

var _out_www = path .join (_out, '/www')



;T (_out) (prepare)

;T (child_files (_out)) (R .forEach (_filename => {{
	;remove (path .join (_out, _filename)) }}))

;T (_out_www) (prepare)

;T (read (path .join (_source_ui, 'index.html'))) ([
	R .replace (
		'<!-- polyfills -->')
		('<!-- polyfills -->' + '\n' + '<script src="cordova.js"></script>'),
	_x => {{ ;write (path .join (_out_www, 'index.html')) (_x) }} ])

;T (child_files (_source_ui)) ([
	Z_ .filter (_filename => _filename !== 'index.html'),
	R .forEach (_filename => {{
		;link
		(path .join (_source_ui, _filename))
		(path .join (_out_www, _filename)) }}) ])

;T (child_files (src__cordova)) ([
	R .filter (_filename => ! _filename .endsWith ('-ama')),
	R .forEach (_filename => {{
		;remove (path .join (_out, _filename))
		;link
		(path .join (src__cordova, _filename))
		(path .join (_out, _filename)) }}) ])

