var _source = argv [2]
var _out = argv [3]

var _source_make_view = path .join (_source, '/make_view');
var _source_view_lens = path .join (_source, '/view_lens');
var _source_design = path .join (_source, '/design');


var _make_view_source = read (_source_make_view)
var { extrapolate_expr } = require (_source_view_lens)
var _make_view = require (_source_make_view)




var invocations = []
var interpolate = visauls_view => {{
	var _call_spot = //TODO
	var _view_expr = visauls_view (_design)
	;invocations .push ([_call_spot, _view_expr])
	return _view_expr }}
var extrapolate = _ =>
	T (_make_view_source
	) (L .modify (as_indexed) (
		$ (T (invocations) (Z_ .map (([_call_spot, _view_expr]) =>
			L .set (index_at (_call_spot)) (extrapolate_expr (_view_expr)) )))))

var _design = T (child_files (_source_design)) ([
	Z_ .map (_filename => 
		so ((_=_=>
		[_name, _value],
		where
		, _name = T (_filename) ([ R .split ('.'), R .head ])
		, _value = read (path .join (_source_design, _filename)) )=>_)),
	R .fromPairs ])



;T (_out) (prepare)

;T (child_files (_out)) (R .forEach (_filename => {{
	;remove (path .join (_out, _filename)) }}))

;write (out) (extrapolate ())
