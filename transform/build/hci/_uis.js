var R = require ('ramda');
var jsdom = require ('jsdom');
var esprima = require ('esprima');

var pre_scripts = require ('./_pre_scripts');
var pre_transforms = [];
var macro = function (x) {
		pre_transforms .push (x);
};

var calls_ = function (func_name) {
	return function (node) {
		return (node .type === 'CallExpression') && node .callee .name === func_name;
	};
};

var top_level_pre_transform = function (will_transform, transformer) {
	return function (source) {
		var items = [ [] ]
			.map (R .tap (function (items) {
				esprima .parseScript (source, { range: true }, function (node) {
					if (will_transform (node)) {
						items .push ({
							start: node .range [0],
							end: node .range [1],
							source: source .slice (node .range [0], node .range [1]),
							args: node .arguments .map (function (node) {
								return source .slice (node .range [0], node .range [1])
							})
						});
					}
				})
			}))
		[0];
		return items .sort (function (a, b) { return b .start - a .start })
			.reduce (function (source, item) {
				return source .slice (0, item .start) + transformer (item .source, item .args) + source .slice (item .end);
			}, source);
	};
};

var concats = R .reduce (R .concat, []);
var middle = R .pipe (R .init, R .tail);
var items_tree_from_pos = function (source, items_table) {
	return function (pos_tree) {
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
			]) .map (items_tree_from_pos (source, items_table))
		}
	};
};
var tree_push = function (tree, next) {
	var tree_middle = middle (tree);
	var start_pos = [tree_middle]
		.map (R .findIndex (function (item) {
			return R .head (item) > R .head (next)
		}))
		.map (R .cond ([
			[R .equals (-1), R .always (tree_middle .length)],
			[R .T, R .identity]
		]))
	[0];
	var end_pos = [tree_middle]
		.map (R .findIndex (function (item) {
			return R .last (item) > R .last (next)
		}))
		.map (R .cond ([
			[R .equals (-1), R .always (tree_middle .length)],
			[R .T, R .identity]
		]))
	[0];
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
var transform_tree = function (transformer) {
	return function (tree) {
		if (R .is (String) (tree))
			return tree;
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
		};
	}
};
var recursive_pre_transform = function (will_transform, transformer) {
	return function (source) {
		var items = [ [] ]
			.map (R .tap (function (items) {
				esprima .parseScript (source, { range: true }, function (node) {
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
		[0];
		var items_by_pos = [items]
			.map (R .groupBy (R .prop ('start')))
			.map (R .map (R .head))
		[0];
		var pos_tree = [items]
			.map (R .chain (function (item) {
				return R .concat ([item], item .args)
			}))
			.map (R .map (function (item) {
				return [item .start, item .end]
			}))
			.map (R .reduce (tree_push, [ 0, source .length ]))
		[0];
		var items_tree = items_tree_from_pos (source, items_by_pos) (pos_tree);
		return transform_tree (transformer) (items_tree);
	};
};

var window = (new jsdom .JSDOM ()) .window;
with (window) {
	eval (pre_scripts);
}
var pre = function (fn) { return fn (); };
var process = function (def, scope) {
	with (scope || {}) {
		return [def]
			.map (R .reduce (function (src, pre_transform) {
				return pre_transform (src)
			}, R .__, pre_transforms))
		[0]
	}
};

module .exports = {
	hydrators: hydrators,
	process: process,
	hydration: function () {
		return 'var __hydrators = [' + hydrators .map ((x) => JSON .stringify (x)) .join (',') + '];';
	}
}
