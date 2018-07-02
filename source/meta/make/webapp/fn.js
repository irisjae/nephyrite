var { T, Z_, R, path, fs, remove, link, child_files, prepare } = require ('./_util')
var { argv } = require ('process')

var _source = argv [2]
var _out = argv [3]

var _merges = path .join (__dirname, '/merges')


;T (_source) (prepare)

;T (child_files (_out)) (R .forEach (filename => {{
	;remove (path .join (_out, filename)) }}))
;T (child_files (_source)) (R .forEach (filename => {{
	;link (path .join (_in, filename)) (path .join (_out, filename)) }}))
;T (child_files (_merges)) (R .forEach (filename => {{
	;remove (path .join (_out, filename))
	;link (path .join (_merges, filename)) (path .join (_out, filename)) }}))
