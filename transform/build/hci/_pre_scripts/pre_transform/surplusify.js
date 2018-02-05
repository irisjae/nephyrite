var esprima = require ('esprima');
var surpluser = require ('surplus/compiler') .compile;
var jsxer = (lo => x => lo .jsxtion .convert (x)) ({
		jsxtion: new (require ('htmltojsx')) ({ createClass: false })
	});


var expression_ = function (_) {
	return esprima .parseScript ('(' + _ + ')', { range: true }) .body [0] .expression;
};
var expression_type = function (_) {
	return expression_ (_) .type;
};
var flatten_object_expression = x =>
	[expression_ (x) .properties]
//.map( R.tap((x)=>console.error(x)))
		.map (R .map (function (prop) {
			return [prop .key .value || prop .key .name, x .slice (prop .value .range [0] - 1, prop .value .range [1] - 1)]
		}))
		.map (R .fromPairs)
//.map( R.tap((x)=>console.error(x)))
	[0]
//TODO: + add support for mixed time expressions
var as_attribute = x =>
	('"' + ('' + x)
		.split ('&') .join ('&amp;')
		.split ('<') .join ('&lt;')
		.split ('"') .join ('&quot;')
	+ '"')
var precompute = eval => x => {
	try {
		return { precomputed: eval (x), expression: x }
	}
	catch (e) {
		return { expression: x }
	}
}


var _fn = R .curry (function (fn, x) {
	return [x]
		.map (x => x .cloneNode (true))
		.map (R .tap (x => x ._fn = fn))
	[0]
});
macro (recursive_pre_transform (calls_ ('_fn'), function (src, args) {
	return `_fn (${[args] .map (R .adjust ((_) => JSON .stringify (_, null, 4), 0)) .map (R .join (',')) [0]})`
}));


var resolve_node = eval => R .pipe (
	eval,
	R .tap (R .cond ([
		[(x) => ! R .is (Node), () =>
			{ throw new Error ('bad node') } ]
	]))
);
var resolve_attrs = eval => R .pipe (
	R .cond ([
		[(x) => expression_type (x) === 'ObjectExpression', flatten_object_expression ],
		[(x) => { try { return eval (x) } catch (e) {} }, eval ],
		[(x) => expression_type (x) === 'Identifier', () => ({})],
		[R .T, () => { throw new Error ('bad attr') }]
	]),
	R .map (precompute (eval)),
	R .map (R .cond ([
		[(x) => R .has ('precomputed') (x) && ! R .is (Function) (x), (x) => '{' + x .expression + '}'],
		[R .has ('expression'), (x) => '{' + x .expression + '}'],
		[R .has ('precomputed'), (x) => as_attribute (x .precomputed)]
	]))
);
var resolve_spreads = eval => R .pipe (
	R .cond ([
		[(x) => expression_type (x) === 'ObjectExpression', () => [] ],
		[(x) => { try { return eval (x) } catch (e) {} }, () => [] ],
		[R .T, (x) => [x]]
	]),
	R .map (precompute (eval)),
	R .map (R .cond ([
		[R .has ('precomputed'), R .prop ('precomputed')],
		[R .has ('expression'), (x) => '{' + '...' + x .expression + '}']
	]))
);
var resolve_lineage = (lo => eval_ => (ancestor, lineage_expr) =>
	[lineage_expr]
		.map (R .cond ([
			[(x) => expression_type (x) === 'ObjectExpression', flatten_object_expression ],
			[R .T, () => { throw new Error ('bad children') }]
		]))
//.map (R .tap (x => console .error ('hm', x)))
		.map (R .mapObjIndexed (function (expr, selector) {
			var source_node = ancestor .querySelector (selector);
			if (! source_node)
				throw new Error ('selector not matching');

			try {
				var x = eval_ (expr);
				if (typeof x === 'function')
					return lo .wrap_jsx_function (x) (source_node);
				else if (x .jsx)
					return x
				else if (R .is (Node) (x))
					return h ('x', '{}', '{}', _ => eval (_));
			}
			catch (e) {}
			return {
				jsx: '{ ' + expr + ' }'
			}
		}))
		.map (R .applySpec ({
			jsx: R .pipe (R .map (R .prop ('jsx')), R .filter (R .identity)),
			pre_stash: R .pipe (R .map (R .prop ('pre_stash')), R .filter (R .identity), R .values, R .concat ([R .identity]), R .apply (R .pipe)),
			post_stash: R .pipe (R .map (R .prop ('post_stash')), R .filter (R .identity), R .values, R .concat ([R .identity]), R .apply (R .pipe))
		}))
	[0]
) ({
	wrap_jsx_function : (x) => R .pipe (
		x,
		R .cond ([
			[R .prop ('jsx'), R .prop ('jsx')],
			[R .is (String), R .identity],
			[R .is (Node), x => h ('x', '{}', '{}', _ => eval (_))],
			[R .T, () => { throw new Error ('bad jsx') }]
		])
	)
});
var escape_regex = function (text) {
	return text .replace (/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
};
var node_to_jsx = function (base_node) {
	//base_node: Node
	//attrs: { AttributeName: expr }
	//spreads: [Identifier]
	//adoptions: { Selector: jsx }
	return function (attrs, spreads, adoptions) {
		var transform_prefix = 'node-to-jsx-' + Math .floor (Math .random () * 10000) + '-';
		var marks = {};
		var next_mark = function (data) {
			var ex = transform_prefix + R .keys (marks) .length;
			marks [ex] = data;
			return ex;
		};
		return [base_node]
			.map (x => x .cloneNode (true))
			.map (R .tap (x => {
				[ R. keys (attrs) ]
					.forEach (R .forEach (function (key) {
						x .setAttribute (key, next_mark ({ val: attrs [key] }));
					}));
				[ spreads ]
					.forEach (R .forEach (function (spread) {
						x .setAttribute (next_mark ({ spread: spread }), '');
					}));
				[ R. keys (adoptions) ]
					.forEach (R .forEach (function (key) {
						var orphan = x .querySelector (key);
						var adoptee = adoptions [key] ;
						orphan .parentNode .insertBefore (document .createTextNode (next_mark ({ child: adoptee })), orphan);
						orphan .parentNode .removeChild (orphan);
					}));
			}))
			.map (x => x .outerHTML)
			.map (jsxer)
			.map (R .reduce (function (jsx, mark) {
				if (R .has ('val') (marks [mark]))
					return jsx .split ('"' + mark + '"') .join (marks [mark] .val)
				else if (R .has ('spread') (marks [mark]))
					return jsx .split ('"' + mark + '"') .join ('...' + marks [mark] .spread)
				else if (R .has ('child') (marks [mark]))
					return jsx .split (mark) .join (marks [mark] .child)
			}, R .__, R .keys (marks)))
		[0]
	};
};
var h = R .curry (function (x, attr, descendants, eval) {
	var node = resolve_node (eval) (x);
	var attrs = resolve_attrs (eval) (attr);
	var spreads = resolve_spreads (eval) (attr);
	var lineage = resolve_lineage (eval) (node, descendants);

	var adoptions = lineage .jsx;
	var pre_stash = lineage .pre_stash;
	var post_stash = lineage .post_stash;
//console.error (adoptions);

	if (x ._fn) {
		var function_node_alias = 'functionnode' + Math .floor (Math .random () * 1000000);
		var function_surplus_alias = function_node_alias .toUpperCase ();

		node = document .createElement (function_node_alias);
		var x_clone = x .cloneNode (true);
		while (x_clone .childNodes .length > 0) {
			node .appendChild (x_clone .childNodes [0]);
		}

		var _pre_stash = pre_stash;
		var _post_stash = post_stash;
		var pre_stash = (x) => _pre_stash (x) .split (function_node_alias) .join (function_surplus_alias);
		var post_stash = (x) => _post_stash (x .split (function_surplus_alias) .join (x ._fn));
	}

	return [node_to_jsx (node) (attrs, spreads, adoptions)]
//.map (R.tap((x)=>console.error(x)))
		.map ((x) => R .merge (
			{
				____pre_transformed: [x] .map (pre_stash) .map (surpluser) .map (post_stash) [0],
			},
			{
				jsx: x,
				pre_stash: pre_stash,
				post_stash: post_stash
			}
		))
	[0];
});

macro (recursive_pre_transform (calls_ ('h'), function (src, args) {
	var evaler = `(q) => eval (q)`;
	return `h (${args .map ((_) => JSON .stringify (_, null, 4)) .concat ([evaler]) .join (',')})`
}));


/*
	.map (pre_transform ('h', R .pipe (
		R .cond ([
			[(src, args) => args .length !== 3, (src, args) => {
				throw new Error ('h has wrong number of arguments')
			}],
			[(src, args) => esprima .parseScript (args [0]) .body [0] .expression .type === 'Identifier', (src, args) => {
				return `
	(function () {
		var xmlserializer = require ('xmlserializer');
		function XMLSerializer () {}
		XMLSerializer .prototype .serializeToString = function (node) {
		    return xmlserializer .serializeToString (node);
		};

		var xmlSerializer = new XMLSerializer ()


		if (R .is (Node) (${args [0]}))
			return [${args [0]}]
		else
			return

		console.log(xmlSerializer.serializeToString(doc))
	} ())
	`
			}],
		]),
		R .objOf ('____surplusify_me'),
		(_) => JSON .stringify (_, null, 4)
	)))
*?
/*
	var x = () => <hey />

	var X = x;

	var q = <X s-n="bad" />
	var qq = <x s-n="bad" />
	var s = <svg xmlns:xlink="http://www.w3.org/1999/xlink">
		<image xlink:href="#asdf" />
	</svg>;
	var d = <div class="hey hi ho" :listening />
*/


macro (top_level_pre_transform (calls_ ('pre'), R .pipe (
	function (pre_fn) {
		with (window) {
			return eval (pre_fn);
		}
	},
	dehydrate
)));
