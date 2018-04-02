var Oo = require ('o-o-o-o-o') .Oo
var o = require ('o-o-o-o-o') .o
var oO = require ('o-o-o-o-o') .oO
var R = require ('ramda')

var esprima = require ('esprima')
var uglify = require ('uglify-js')
var auto = require ('./auto')


var call_auto = node =>
	node .type === 'CallExpression' && node .callee .name === 'auto'

var call_auto_ = x =>
	node =>
		node .type === 'CallExpression' && node .callee .type === 'MemberExpression'
		&& node .callee .object .name === 'auto' && node .callee .property .name === x

var auto_require = node =>
	node .type === 'VariableDeclaration' && node .declarations .length === 1
	&& node .declarations [0] .id .name === 'auto'
	&& node .declarations [0] .init .type === 'CallExpression' && node .declarations [0] .init .callee .name === 'require'
	&& node .declarations [0] .init .arguments .length === 1 && node .declarations [0] .init .arguments [0] .type === 'Literal'
	&& node .declarations [0] .init .arguments [0] .value === '__auto'



var concats = R .reduce (R .concat, [])
var middle = x => R .tail (R .init (x))
var items_tree_from_pos = (source, items_table) =>
	pos_tree => {
		if (pos_tree .length === 2) {
			return source .slice (R .head (pos_tree), R .last (pos_tree))
		}
		else if (items_table [R .head (pos_tree) + '-' + R .last (pos_tree)]) {
			var id = R .head (pos_tree) + '-' + R .last (pos_tree)

			return {
				item: items_table [id],
				segments: items_tree_from_pos (source, R .omit ([id], items_table)) (pos_tree)
			}
		}
		else {
			var tree_middle = middle (pos_tree)

			return concats ([
				[ [R .head (pos_tree), R .head (R .head (tree_middle))] ] ,
				R .addIndex (R .chain) ((subtree, i) => {
					if (i === 0)
						return [subtree]
					else
						return [ [R .last (tree_middle [i - 1]), R .head (subtree)], subtree ] 
				}) (tree_middle),
				[ [R .last (R .last (tree_middle)), R .last (pos_tree)] ]
			])
			.map (items_tree_from_pos (source, items_table))
		}
	}

var tree_push = (tree, next) => {
	var tree_middle = middle (tree)
	var start_pos = Oo (tree_middle,
		o (R .findIndex (function (item) {
			return R .head (item) > R .head (next)
		})),
		o (R .cond ([
			[x => x === -1, x => tree_middle .length],
			[R .T, R .identity]
		])))
	var end_pos = Oo (tree_middle,
		o (R .findIndex (item => R .last (item) > R .last (next))),
		o (R .cond ([
			[R .equals (-1), R .always (tree_middle .length)],
			[R .T, R .identity]
		])))

	if (start_pos > end_pos + 1) {
		; throw new Error ('bad tree')
	}
	else if (start_pos === end_pos + 1)
		return concats ([
			[R .head (tree)],
			tree_middle .slice (0, start_pos - 1),
			[tree_push (tree_middle [start_pos - 1], next)],
			tree_middle .slice (end_pos + 1),
			[R .last (tree)]
		])
	else
		return concats ([
			[R .head (tree)],
			tree_middle .slice (0, start_pos),
			[ [tree_middle .slice (start_pos, end_pos)] .map (R .reduce (tree_push, next)) [0] ],
			tree_middle .slice (end_pos),
			[R .last (tree)]
		])
}
//TODO: add caching
var tree_collect = (seed, reduce, item_reduce) => 
	tree => {
		if (R .is (String) (tree))
			return seed (tree)
		else if (R .is (Array) (tree)) 
			return Oo (tree,
				o (R .map (tree_collect (seed, reduce, item_reduce))),
				o (reduce))
		else if (tree .item) 
			return item_reduce (tree)
		else 
			throw new Error ('bad tree')
	}
var tree_transform = item_handling => 
	tree_collect (
		x => x,
		R .join (''),
		item_handling)
var recursive_source_tree_transform = transformer =>
	tree_transform (tree => {
		var transformed_segments = Oo (tree .segments, o (R .map (recursive_source_tree_transform (transformer))))
//console.log(transformed_segments)

		return Oo (tree .item,
			o (R .evolve ({
				src : x => Oo (transformed_segments, o (R .join (''))),
				args : x => Oo (transformed_segments, o (R .addIndex (R .filter) ((x, i) => i % 2 === 1)))
			})),
			o (transformer))
	})
var top_level_source_tree_transform = transformer =>
	tree_transform (tree => {
		var transformed_segments = Oo (tree .segments, o (R .map (tree_stich)))
//console.log(transformed_segments)

		return Oo (tree .item,
			o (R .evolve ({
				src : x => Oo (transformed_segments, o (R .join (''))),
				args : x => Oo (transformed_segments, o (R .addIndex (R .filter) ((x, i) => i % 2 === 1)))
			})),
			o (transformer))
	})
var tree_stich = tree_transform (Oo (R .__, o (x => x .segments), o (R .map (tree_stich)), o (R .join (''))))

var items_tree = items_selector =>
	source => {
		var items = Oo ([],
			o (R .tap (items => {
				; esprima .parseScript (source, { range: true, loc: true }, node => {
					var selection = items_selector (node)

					if (selection) {
						; items .push ({
							start: node .range [0],
							end: node .range [1],
							loc: node .loc,
							src: source .slice (node .range [0], node .range [1]),
							args: node .arguments && node .arguments .map (function (node) {
								return { start: node .range [0], end: node .range [1] }
							})
						})
					}
				})
			})))
		var items_by_pos = Oo (items,
			o (R .groupBy (x => x .start + '-' + x .end)),
			o (R .map (R .head)))
		var pos_tree = Oo (items,
			o (R .chain (item =>
				R .concat ([item], item .args || [])
			)),
			o (R .map (item =>
				[item .start, item .end]
			)),
			o (R .reduce (tree_push, [ 0, source .length ])))
		var items_tree = items_tree_from_pos (source, items_by_pos) (pos_tree)

		//console .log (JSON.stringify(items_tree, null, 4))

		return items_tree
	}


var recursive_pre_transform = (items_selector, transformer) =>
	Oo (R .__,
		o (items_tree (items_selector)),
		o (recursive_source_tree_transform (transformer)))
var top_level_pre_transform = (items_selector, transformer) =>
	Oo (R .__,
		o (items_tree (items_selector)),
		o (top_level_source_tree_transform (transformer)))



var pre_process = Oo (o, () => {
	var marked_expr = scope => src =>
		...
	var instrument_scope = ...
	var pick_scope_on = scope_trees_to_visit => picked_target => {
		...
	}
	var scope_eval = ...

	var targets = tree_collect (x => [], R .reduce (R .concat, [], R .__), x => x .item .targets)
	var aggregate = targets => root_context => scope_tree => {
		var picked_targets = []
		var scope_trees_to_visit = []

		var pick_scope = pick_scope_on (scope_trees_to_visit) (picked_targets)

		; var instrument_tree = tree_transform (
			scope_tree => {
				var o_targets = targets (scope_tree)

				if (R .length (o_targets) === 0)
					return tree_stich (scope_tree .segments)
				else {
					var instrumented_segments = Oo (scope_tree .segments,
						o (R .map (instrument_tree)))

					; Oo (o_targets,
						o (R .forEach (x => {
							; scope_trees_to_visit .push ([ x, scope_tree ]) 
						})))
					return Oo (scope_tree,
						o (recursive_source_tree_transform (instrument (pick_scope))))
				}
			})
		

		; var instrumented_src = instrument_tree (scope_tree)
	}

	return marker => (src, parent_scope) => {
		var o_to_process = {}
		var o_eval_scopes

		; var marked_src = Oo (src,
			o (recursive_pre_transform (marker, (src, args, loc) => {
				var id = loc .start .line + ':' + loc .start .column + '-' + loc .end .line + ':' + loc .end .column
				var marked_src = marked (id) (src)

				; o_to_process [id] = src

				return marked_src
			})))

		; o_eval_scopes = Oo (marked_src, o (function_scopes))




		

		
	}
}


module .exports = (filename, src) =>
	Oo (src,
//o (R.tap(x=>console.log(x))),
		o (top_level_pre_transform (auto_require, x => '')),
//o (R.tap(x=>console.log(x))),
		o (recursive_pre_transform (call_auto_ ('scale_using'), x =>
			`auto .____scale_using (${x .args .map (x => JSON .stringify (x, null, 4)) .join (',')})`
		)),
//o (R.tap(x=>console.log(x))),
		o (recursive_pre_transform (call_auto_ ('h'), x => {
			var evaler = `(q) => eval (q)`
			return `auto .____h (${x .args .map ((x) => JSON .stringify (x, null, 4)) .concat ([evaler]) .join (',')})`
		})),
		o (src => {
			var ast = uglify .parse (src)
			; ast .figure_out_scope ()
		}),
//o (R.tap(x=>console.log(x))),
		o (top_level_pre_transform (call_auto, x => auto .eval (x .args [0], filename, x .loc)))
	)
	//return assets, rehydrators from require ('./hydration')
