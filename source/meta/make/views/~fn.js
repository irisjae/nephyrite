var _source = argv [2]
var _out = argv [3]

var _source_make_view = path .join (_source, '/make_view');
var _source_view_lens = path .join (_source, '/view_lens');
var _source_visuals = path .join (_source, '/visuals');


var _make_view_source = read (_source_make_view)
var { extrapolate_expr } = require (_source_view_lens)
var _make_view = require (_source_make_view)


var as_indexed = 
	[ L .reread (_str => ({ 0: _str }))
	, L .rewrite (
		$ ([ R .toPairs
		, Z_ .sortBy (([index, _]) => index)
		, Z_ .map (([_, fragment]) => fragment)
		, Z_ .joinWith ('') ])) ]

var index_at = ([_start, _end]) =>
	so ((_=_=>
	[ L .reread (rechunk_for_index), _index ],
	where
	, _index = '' + _start
	, chunk_start = [0, L .reread (n => + n)]
	, index = n => '' + n
	, start = n => + n
	, rechunk_for_index = by (chunks =>
		so ((_=_=>
		!! (! chunks_compatible)
		? _ => undefined 
		: so ((_=_=>
		$ ([ L .set (pre_break_index) (pre_break_string)
		, L .set (break_index) (break_string)
		, L .set (post_break_index) (post_break_string) ]),
		where
		, [pre_break_index, pre_break_string] = !! (_chunk_start === _start)
			? [index (_chunk_start - 0.1), '']
			: [index (_chunk_start), _chunk_string .slice (0, _start - _chunk_start)]
		, [break_index, break_string] =
			[index (_start), _chunk_string .slice (_start - _chunk_start, _end - _chunk_start)]
		, [post_break_index, post_break_string] = !! (_chunk_end === _end)
			? [index (_end - 0.1), '']
			: [index (_end), _chunk_string .slice (_end - _chunk_start)] )=>_),
		where 
		, sorted_chunks = T (chunks) ([
			R .toPairs, 
			Z_ .sortBy (([index, _]) => index) ])
		, _chunk_order = T (sorted_chunks) (
			R .findLastIndex ($ ([L .get (chunk_start), Z_ .lte (_start)])))
		, [_chunk_index, _chunk_string] = T (sorted_chunks) (
			R .findLast ($ ([L .get (chunk_start), Z_ .lte (_start)])))
		, [_chunk_start, _chunk_end] =
			[start (_chunk_index), start (_chunk_index) + _chunk_string .length]
		, chunks_compatible = _chunk_order !== -1
			&& Z_ .even (_chunk_order)
			&& _chunk_end >= _end )=>_)) )=>_)
	
	

var invocations = []
var interpolate = visauls_view => {{
	var _call_spot = //TODO
	var _view_expr = visauls_view (_visuals)
	;invocations .push ([_call_spot, _view_expr])
	return _view_expr }}
var extrapolate = _ =>
	T (_make_view_source
	) (L .modify (as_indexed) (
		$ (T (invocations) (Z_ .map (([_call_spot, _view_expr]) =>
			L .set (index_at (_call_spot)) (extrapolate_expr (_view_expr)) )))))

var _visuals = T (child_files (_source_visuals)) ([
	Z_ .map (_filename => 
		so ((_=_=>
		[_name, _value],
		where
		, _name = T (_filename) ([ R .split ('.'), R .head ])
		, _value = read (path .join (_source_visuals, _filename)) )=>_)),
	R .fromPairs ])



;T (_out) (prepare)

;T (child_files (_out)) (R .forEach (_filename => {{
	;remove (path .join (_out, _filename)) }}))


;_make_view (interpolate)
;write (out) (extrapolate ())
