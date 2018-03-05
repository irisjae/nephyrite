var Oo = require ('o-o-o-o-o') .Oo;
var o = require ('o-o-o-o-o') .o;
var oO = require ('o-o-o-o-o') .oO;
var R = require ('ramda');

var esprima = require ('esprima');
var auto = require ('./auto');


var call_auto = node =>
	node .type === 'CallExpression' && node .callee .name === 'auto'
;
var call_auto_ = x =>
	node =>
		node .type === 'CallExpression' && node .callee .type === 'MemberExpression'
		&& node .callee .object .name === 'auto' && node .callee .property .name === x
;
var auto_require = node =>
	node .type === 'VariableDeclaration' && node .declarations .length === 1
	&& node .declarations [0] .id .name === 'auto'
	&& node .declarations [0] .init .type === 'CallExpression' && node .declarations [0] .init .callee .name === 'require'
	&& node .declarations [0] .init .arguments .length === 1 && node .declarations [0] .init .arguments [0] .type === 'Literal'
	&& node .declarations [0] .init .arguments [0] .value === '__auto'
;

var top_level_pre_transform = (will_transform, transformer) =>
	(source) => {
		var items = Oo ([],
			o (R .tap (function (items) {
				esprima .parseScript (source, { range: true, loc: true }, function (node) {
					if (will_transform (node)) {
						items .push ({
							start: node .range [0],
							end: node .range [1],
							location: node .loc,
							source: source .slice (node .range [0], node .range [1]),
							args: node .arguments && node .arguments .map (function (node) {
								return source .slice (node .range [0], node .range [1])
							})
						});
					}
				})
			}))
		);
		return items .sort (function (a, b) { return b .start - a .start })
			.reduce (function (source, item) {
				return source .slice (0, item .start) + transformer (item .source, item .args, item .location) + source .slice (item .end);
			}, source);
	}
;

var concats = R .reduce (R .concat, []);
var middle = x => R .tail (R .init (x));
var items_tree_from_pos = (source, items_table) =>
	pos_tree => {
		if (pos_tree .length === 2) {
			return source .slice (pos_tree [0], pos_tree [1]);
		}
		else if (items_table [pos_tree [0]]) {
			return {
				item: true,
				segments: items_tree_from_pos (source, R .omit (['' + pos_tree [0]], items_table)) (pos_tree)
			}
		}
		else {
			var tree_middle = middle (pos_tree);
			return concats ([
				[ [R .head (pos_tree), R .head (R .head (tree_middle))] ],
				R .addIndex (R .chain) (function (subtree, i) {
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
;
var tree_push = (tree, next) => {
	var tree_middle = middle (tree);
	var start_pos = Oo (tree_middle,
		o (R .findIndex (function (item) {
			return R .head (item) > R .head (next)
		})),
		o (R .cond ([
			[x => x === -1, x => tree_middle .length],
			[R .T, R .identity]
		]))
	);
	var end_pos = Oo (tree_middle,
		o (R .findIndex (function (item) {
			return R .last (item) > R .last (next)
		})),
		o (R .cond ([
			[R .equals (-1), R .always (tree_middle .length)],
			[R .T, R .identity]
		]))
	);
	if (start_pos > end_pos + 1)
		throw new Error ('bad tree');
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
};
//TODO: add caching
var transform_tree = transformer =>
	tree => {
		if (R .is (String) (tree))
			return tree
		else if (tree .item) {
			return transformer (
				transform_tree (transformer) (tree .segments),
				tree .segments .map (transform_tree (transformer)) .filter (function (x, i) {
					return i % 2 === 1
				})
			)
		}
		else if (R .is (Array) (tree)) {
			return tree .map (transform_tree (transformer)) .join ('')
		}
		else {
			throw new Error ('bad tree')
		}
	}
;
//TODO: add location too to recursive_pre_transform
var recursive_pre_transform = (will_transform, transformer) =>
	source => {
		var items = Oo ([],
			o (R .tap (items => {
				esprima .parseScript (source, { range: true }, node => {
					if (will_transform (node)) {
						items .push ({
							start: node .range [0],
							end: node .range [1],
							args: node .arguments .map (function (node) {
								return { start: node .range [0], end: node .range [1] }
							})
						});
					}
				})
			}))
		);
		var items_by_pos = Oo (items,
			o (R .groupBy (x => x .start)),
			o (R .map (R .head))
		);
		var pos_tree = Oo (items,
			o (R .chain (item =>
				R .concat ([item], item .args)
			)),
			o (R .map (item =>
				[item .start, item .end]
			)),
			o (R .reduce (tree_push, [ 0, source .length ]))
		);
		var items_tree = items_tree_from_pos (source, items_by_pos) (pos_tree);
		return transform_tree (transformer) (items_tree);
	}
;


module .exports = (filename, src) =>
	Oo (src,
		o (top_level_pre_transform (auto_require, (src, args) => '')),
		o (recursive_pre_transform (call_auto_ ('scale_using'), (src, args) =>
			`auto .____scale_using (${args .map (x => JSON .stringify (x, null, 4)) .join (',')})`
		)),
		o (recursive_pre_transform (call_auto_ ('h'), (src, args) => {
			var evaler = `(q) => eval (q)`;
			return `auto .____h (${args .map ((x) => JSON .stringify (x, null, 4)) .concat ([evaler]) .join (',')})`
		})),
		o (top_level_pre_transform (call_auto, (src, args, location) => auto .eval (args [0], filename, location)))
	)
	//return assets, rehydrators from require ('./hydration')
