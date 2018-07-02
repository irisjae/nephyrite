var { T, Z_, R, from_just, path, fs, link, ext_files, prepare } = require ('./_util')
var { argv } = require ('process')

var _source = argv [2]
var _out = argv [3]


;T (_out) (prepare)

;T (ext_files ('') (_source)) (R .forEach (_source_file/* of file*/ => {{
	var _out_file = T (_source_file) ([
		Z_ .stripPrefix (_source),
		from_just,
		_filename => path .join (_out, _filename) ])
	var _out_dir = T (_out_file) ([
		R .split ('/'),
		R .slice (0, -1),
		R .join ('/') ])

	;prepare (_out_dir)
	;link (_source_file) (_out_file) }}))
