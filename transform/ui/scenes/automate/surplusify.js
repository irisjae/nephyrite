var Oo = require ('o-o-o-o-o') .Oo;
var o = require ('o-o-o-o-o') .o;
var oO = require ('o-o-o-o-o') .oO;
var R = require ('ramda');
var esprima = require ('esprima');
var surpluser = require ('surplus/compiler') .compile;
var jsxer = (jsxtion =>
	x => jsxtion .convert (x)
) (new (require ('htmltojsx')) ({ createClass: false }));


var window = require ('__window');
var document = window .document;
var Node = require ('__window/Node');


var proto_merge_all = R .reduce ((x, next) =>
	Oo (Object .create (x),
		o (R .tap (x => {Object .assign (x, next)}))
	), null);
var proto_length = object => x =>
	(object == null) ?
		Infinity
	: (R .contains (x, Object .getOwnPropertyNames (object))) ?
		0
	:
		proto_length (Object .getPrototypeOf (object)) (x) + 1
var throw_ = x => { throw x };
var switch_ = R .cond ([
	[x => Oo (x, o (R .is (Array)))
		&& Oo (x, o (R .all (x => Oo (x, o (R .is (Array))) && x .length === 2)))
		, choices => 
			situation => {
				var x;
				for (var i = 0; i < choices .length; i ++) {
					if (x = choices [i] [0] (situation))
						return choices [i] [1] (x)
				}
				throw new Error ('undecided switch')
			}
	],
	[R .T, x => throw_ (new Error ('bad switch_'))]
]);
var as_ = x => R .cond ([
	[x, x => x]
])



module .exports = dehydrate => {
	var expression_ = x =>
		esprima .parseScript ('(' + x + ')', { range: true }) .body [0] .expression
	;
	var expression_type = x =>
		expression_ (x) .type
	;
	var flatten_object_expression = x =>
		Oo (expression_ (x) .properties,
			o (R .map (prop => [
				prop .key .value || prop .key .name
				, x .slice (prop .value .range [0] - 1, prop .value .range [1] - 1)
			])),
			o (R .fromPairs)
		);
	var flatten_array_expression = x =>
		Oo (expression_ (x) .elements,
			o (R .map (function (element) {
				return x .slice (element .range [0] - 1, element .range [1] - 1)
			}))
		);
	//maybe add support for mixed time expressions
	var precompute = context => Oo (R .__,
		o (x => ({ expression: x })),
		o (R .tryCatch (
			x => R .merge (x, {
				____pre_transformed: Oo (x .expression, o (context), o (dehydrate))
			})
			, (x, y) => y
		))
	);

	var function_expression = x => R .contains (expression_type (x), ['FunctionExpression', 'ArrowFunctionExpression']);
	var object_expression = x => R .contains (expression_type (x), ['ObjectExpression']);
	var array_expression = x => R .contains (expression_type (x), ['ArrayExpression']);
	var identifier_expression = x => R .contains (expression_type (x), ['Identifier']);


	var resolve_node = context => Oo (R .__,
		o (switch_ ([
			[R .tryCatch (context, R .F), switch_ ([
				[as_ (R .is (Node)), x => x],
				[as_ (x => x .marked_node), x => x]
			])],
			[as_ (function_expression), x => ({ function_: x })]
		]))
	);
	var resolve_attrs = context => Oo (R .__,
		o (switch_ ([
			[as_ (object_expression), Oo (R .__,
				o (flatten_object_expression),
				o (R .map (Oo (R .__, 
					o (precompute (context)),
					o (switch_ ([
						[x => x .____pre_transformed, x => x],
						[x => x .expression, x => x]
					]))
				)))
			)],
			[R .tryCatch (context, R .F), R .map (dehydrate)],
			[as_ (identifier_expression), x => ({})]
		]))
	);
	var resolve_attr_spreads = context => Oo (R .__,
		o (switch_ ([
			[as_ (object_expression), x => []],
			[R .tryCatch (context, R .F), x => []],
			[as_ (identifier_expression), x => [x .expression]]
		]))
	);
	var resolve_adoptions = (context, base_node) => switch_ ([
		[as_ (object_expression), Oo (R .__,
			o (flatten_object_expression),
			o (R .toPairs),
			o (R .map (x =>
				({
					selector: x [0],
					selection: base_node .querySelector (x [0]),
					expression: x [1]
				})
			)),
			o (switch_ ([
				[as_ (R .all (x => x .selection)), x => x]
			])),
			o (R .map (x =>
				R .merge (x, {
					adoption: Oo (x .expression,
						o (switch_ ([
							[R .tryCatch (Oo (R .__,
	//o (R.tap(x=>{debugger;eval('debugger;')})),
								o (context), o (R .cond ([
									[R .is (Function), Oo (x .selection, R .__)],
									[R .T, x => x]
								])),
								o (switch_ ([
									[as_ (x => x .marked_node), x => x],
									[as_ (R .is (Node)), x => ____h ('x', '{}', '{}', y => eval (y))],
									[dehydrate, x => ({ ____pre_transformed: x })]
	//if fails, x is non-dehydratable
	//aka probably was function that was supposed to be passed to surplus as dynamic function
								]))), R .F), x => x],
							[as_ (R .tryCatch (expression_, R .F)), x => ({ expression: x })]
						]))
					)
				})
			)),
			o (R .map (x => [x .selector, x .adoption])),
			o (R .fromPairs)
		)],
		[as_ (array_expression), Oo (R .__,
			o (flatten_array_expression),
			o (switch_ ([
				[R .tryCatch (Oo (R .__, o (context), o (R .cond ([
	//node transformers are useless here, as arrays dont transform nodes
						[R .is (Function), R .F],
						[R .T, x => x]
					]))), R .F)
					, switch_ ([
						[as_ (x => x .marked_node), x => x],
						[as_ (R .is (Node)), x => ____h ('x', '{}', '{}', y => eval (y))],
						[dehydrate, x => ({ ____pre_transformed: x })]
					])],
				[as_ (R .tryCatch (expression_, R .F)), x => ({ expression: x })]
			]))
		)]
	]);
	//base_node: node | marked_node | identifier-expr (runtime function)
	//attrs: { attribute-name: expr | pre_transformed }
	//attr_spreads: [ identifier-expr ]
	//adoptions: { selector: expr | pre_transformed | marked_node } | [ expr | pre_transformed | marked_node ]
	var marked_node = (attrs, attr_spreads, adoptions) =>
		(node) => {
			var transform_prefix = 'placeholder-of-decorate-node-' + Math .floor (Math .random () * 10000) + '-';
	//console.error('-------------------------------------')
			var marks = proto_merge_all (R .values (adoptions) .concat ([node]) .map (x => x .marks));
			var next_mark = (data) => {
				if (data ._function)
					var ex = R .concat (R .toUpper (transform_prefix .slice (0, 1)), transform_prefix .slice (1)) + R .keys (marks) .length;
				else
					var ex = transform_prefix + R .keys (marks) .length;
				marks [ex] = data;
				return ex;
			}

			return Oo (node,
	//o (R.tap(x=>{debugger;eval('debugger;')})),
				o (switch_ ([
					[as_ (R .is (Node)), x => x .cloneNode (true)],
					[x => x .marked_node, x => x .cloneNode (true)],
					[x => x .function_, x => document .createElement (next_mark ({ function_: x }))]
				])),
				o (R .tap (x => {
					Oo (R .keys (attrs),
						oO (R .forEach (function (key) {
							x .setAttribute (key, next_mark ({ val: attrs [key] }));
						})))
					Oo (attr_spreads,
						oO (R .forEach (function (spread) {
							x .setAttribute (next_mark ({ spread: spread }), '');
						})))
					Oo (adoptions,
						oO (R .cond ([
							[R .is (Object), Oo (R .__,
								o (R .keys),
								oO (R .forEach (function (selector) {
									var orphan = x .querySelector (selector);
									var adoptee = adoptions [selector] ;
									orphan .parentNode .insertBefore (document .createElement (next_mark ({ adoption: adoptee })), orphan);
									orphan .parentNode .removeChild (orphan);
								}))
							)],
							[R .is (Array), R .forEach (function (adoption) {
								x .insertBefore (document .createElement (next_mark ({ adoption: adoption })), null);
							})]
						])))
				})),
	//o(R.tap(x=>console.error(Oo (R.keysIn (marks), o(R.filter(x=>marks[x].adoption)),o (R .sortBy (proto_length (marks))))))),
	//o(R.tap(x=>console.error('----from:'))),
	//o(R.tap(x=>console.error(x.outerHTML))),
	//o(R.tap(x=>{debugger;eval('debugger;')})),
				o (x => ({
					marked_node: x,
					marks: marks
				}))
			)
		}
	;
	var resolve_marked_node = marks => (_ => Oo (R .__,
	//o(R.tap(x=>console.error('-------------------------------------'))),
	//o(R.tap(x=>console .error ('marks: ', R.keysIn(marks).filter(x=>marks[x].adoption)))),
	//o(R.tap(x=>console.error('----from:'))),
	//o(R.tap(x=>console.error(x.outerHTML))),
		o (_ .resolve_node_adoptions),
		o (x => x .outerHTML),
	//o(R.tap(x=>console.error('----to:'))),
	//o(R.tap(x=>console.error(x))),
		o (_ .resolve_expression_adoptions)
	//,o(R.tap(x=>{console.error(x)}))
	))
		((_ => ({
			resolve_node_adoptions: Oo (R .__,
				o (x => x .cloneNode (true)),
				o (R .tap (x =>
					Oo (_ .node_adoptions, o (R .sortBy (proto_length (marks))), oO (R .forEach (marker => (_ => {
						var placeholder = x .querySelector (marker);
	//console.error('placeholder: ',placeholder.outerHTML);
						placeholder .parentNode .insertBefore (_ .adoption_node, placeholder);
						placeholder .parentNode .removeChild (placeholder); 
					})
						({ adoption_node: marks [marker] .adoption .marked_node }))))
				))),
			resolve_expression_adoptions: Oo (R .__,
				o (R .reduce ((x, marker) =>
					(_ => Oo (x, o (R .reduce ((x, alias) =>
						Oo (x, o (R .replace (alias, '{ ' + _ .marked .adoption .expression + ' }')))
					, R .__, _ .aliases))))
						({
							aliases: [
								`<${marker}></${marker}>`,
								`<${marker}/>`
							],
							marked: marks [marker]
						})
				, R .__, _ .expression_adoptions)))
		}))
			((_ => ({
				node_adoptions: _ [0],
				expression_adoptions: _ [1]
			}))
				(Oo (marks,
					o (R .keysIn),
					o (R .filter (marker => (_ => _ .marked .adoption) ({ marked: marks [marker] }))),
					o (R .partition (marker => (_ => _ .adoption .marked_node) ({ adoption: marks [marker] .adoption })))
	//,o(R.tap(x=>{debugger;eval('debugger;')}))
				))));
	var resolve_jsx = marks => 
		Oo (marks,
			o (R .keysIn),
			o (R .chain (marker =>
				(_ => (R .has ('val') (_ .marked)) ?
					[R .replace ('"' + marker + '"', '{ ' + _ .marked .val + ' }')]
				: (R .has ('spread') (_ .marked)) ?
					[R .replace ('"' + marker + '"', '{ ...' + _ .marked .spread + ' }')]
				: (R .has ('function_') (_ .marked)) ?
					[R .replace (marker, _ .marked .val)]
				:
					[]
				) ({ marked: marks [marker] })
			)),
			Oo (R .__,
				o (R .concat ([R .__])),
				o (R .apply (Oo))
			)
		);
	var ____h = (node_expr, attrs_expr, adoptions_expr, context) => {
		var node = resolve_node (context) (node_expr);
		var attrs = resolve_attrs (context) (attrs_expr);
		var attr_spreads = resolve_attr_spreads (context) (attrs_expr);
		var adoptions = resolve_adoptions (context, node) (adoptions_expr);
		return Oo (node,
			o (marked_node (attrs, attr_spreads, adoptions)),
	//o (R .tap (x => console .error (x .marks))),
			o (x => R .merge (x, {
				____pre_transformed: Oo (x .marked_node,
					o (resolve_marked_node (x .marks)),
	//o (R.tap(x=>console.error(x))),
					o (jsxer),
	//o (R.tap(x=>console.error(x))),
					o (resolve_jsx (x .marks)),
	//o (R.tap(x=>console.error(x))),
					o (surpluser))
			})))
	};

	return ____h
}
