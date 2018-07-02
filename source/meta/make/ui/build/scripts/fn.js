var { T, Z_, R, from_just, path, fs, link, ext_files, prepare } = require ('./_util')
var { argv } = require ('process')

var _source = argv [2]
var _out = argv [3]


;T (_out) (prepare)

;T (ext_files ('.js') (_source)) (R .forEach (_source_file => {{
		var _out_file = T (_source_file) ([
			R .split ('/'),
			R .last, 
			_filename => path .join (_out, _filename) ])

		;link (_source_file) (_out_file) }}))
