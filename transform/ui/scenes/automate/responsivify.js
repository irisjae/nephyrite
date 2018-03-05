var Oo = require ('o-o-o-o-o') .Oo;
var o = require ('o-o-o-o-o') .o;
var oO = require ('o-o-o-o-o') .oO;
var R = require ('ramda');

var assert = msg => x => {
	if (! x)
		throw new Error (msg + ' is false')
	else
		return x;
};


var node_children_collect = (samples, info_collect) =>
	Oo (R .head (samples) .children,
		o (x => (x) ?
			Array .from (x)
		:
			[]
		),
		o (R .toPairs),
		o (R .chain (pair => {
			var key = pair [0]
			var val = pair [1]
			var info = info_collect (val, key)
			return (R .length (R .keys (info))) ?
				[[key, info]]
			:
				[]
		})),
		o (R .fromPairs)
	)
;

var scale_flux = x => {
	var dx1 = x [1] .width - x [0] .width;
	var dx2 = x [2] .width - x [0] .width;
	var dy1 = x [1] .height - x [0] .height;
	var dy2 = x [2] .height - x [0] .height;
	var dv1 = x [1] .$ - x [0] .$;
	var dv2 = x [2] .$ - x [0] .$;
	
	var x_flux = (dy2 * dv1 - dy1 * dv2) / (dx1 * dy2 - dy1 * dx2)
	var y_flux = (dx1 * dv2 - dx2 * dv1) / (dx1 * dy2 - dy1 * dx2)
	
	return {
		x_flux: x_flux,
		y_flux: y_flux
	}
}

var val_scale_info = function (samples) {
	var number_breakdowns = samples .map (number_breakdown_from_val);
	var base_numbers = R .head (number_breakdowns) .filter (function (v, i) {
		return i % 2 === 1;
	});
	if (! base_numbers .length)
		return []
	else
		return base_numbers .reduce (function (sum, next, k) {
			var i = 2 * k + 1;
			if (next === number_breakdowns [1] [i] && next === number_breakdowns [2] [i]) {
				return R .adjust (
					R .concat (R .__, '' + next + number_breakdowns [0] [i + 1])
				) (sum .length - 1) (sum)
			}
			else {
				var fluxes = scale_flux (samples .map ((sample, l) =>
					R .merge (sample, {
						$: number_breakdowns [l] [i]
					})
				));
				return R .concat (sum, [[next, fluxes .x_flux, fluxes .y_flux], number_breakdowns [0] [i + 1]]);
			}
		}, [number_breakdowns [0] [0]])
};
	var val_string_break = function (x) {
		return x
			.split (/(-?\d+(?:\.\d+)?(?:e-?\d+)?)/)
			.map (function (v, i) {
				if (i % 2 === 1) return + v; else return v
			});
	};
	var number_breakdown_from_val = Oo (R .__, o (x => x .$), o (val_string_break));

var element_scale_info = samples =>
	Oo (Array .from (R .head (samples) .$ .attributes),
		o (R .map (x => x .nodeName)),
		o (R .chain (function (name) {
			var vals = samples .map (R .evolve ({
				$: x => x .getAttribute (name)
			}));
			if (vals [0] .$ == vals [1] .$ && vals [1] .$ == vals [2] .$) 
				return [];
			else
				return [[name, val_scale_info (vals)]]
		})),
		o (R .fromPairs)
	)
;

var node_children_scale_info = function (samples) {
	return node_children_collect (samples .map (x => x .$), function (child, i) {
		return node_scale_info (samples .map (R .evolve ({
			$: Oo (R .__, o (x => x .children), o (x => x [i]))
		})))
	});
};

var node_scale_info = samples =>
	R .merge (
		node_children_scale_info (samples),
		Oo (element_scale_info (samples),
			o (R .cond ([
				[x => R .length (R .keys (x)) !== 0,
					x => ({ scale: x })
				],
				[R .T,
					x => undefined
				]
			])))
	)
;

/*
var def_node_scale_info = function (samples) {
	return node_children_collect (samples, function (child) {
		var def_id = child .getAttribute ('id');
		return node_scale_info ([
			{ $: child, width: R .head (samples) .width, height: R .head (samples) .height },
			// HACK: sometimes stretched svgs have different connections, so || child after get selector
			{ $: assert ('sample 1 matches') (samples [1] .$ .querySelector ('#' + def_id) || child), width: samples [1] .width, height: samples [1] .height },
			{ $: assert ('sample 2 matches') (samples [2] .$ .querySelector ('#' + def_id) || child), width: samples [2] .width, height: samples [2] .height }
		])
	});
};

var defs_scale_info = function (samples) {
	return R .merge (
		def_node_scale_info (samples),
		Oo (element_scale_info (samples),
			o (R .cond ([
				[x => R .length (R .keys (x)),
					x => ({ scale: x })
				],
				[R .T,
					x => undefined
				]
			])))
	)
};
*/

var id_by_attr = function (name) {
	return Oo (R .__,
		o (x => x .getAttribute (name)),
		o ((name === 'xlink:href') && R .match (/^(#[^]+)$/)
			|| (name === 'fill') && R .match (/^url\((#[^)]+)\)$/)),
		o (x => x [1])
	)
};

var element_connection_info = samples =>
	Oo (R .head (samples) .attributes,
		o (x => (x) ?
			Array .from (x)
		:
			[]
		),
		o (R .map (x => x .nodeName)),
		o (R .filter (R .contains (R .__, [ 'xlink:href', 'fill' ]))),
		o (R .map (name => samples .map (id_by_attr (name)))),
		o (R .chain (ids =>
			(! R .all (x => x) (ids)) ?
				[]
			:
				[ids]
		))
	)
;

var node_children_connection_info = function (samples) {
	return node_children_collect (samples, function (child, i) {
		return node_connection_info (samples
			.map (Oo (R .__, o (x => x .children), o (x => x [i])))
			.map (R .tap ((x, i) => {
				assert ('sample ' + i + ' connection matches') (x)
			}))
		)
	})
};

var node_connection_info = function (samples) {
	return R .merge (
		node_children_connection_info (samples),
		Oo (element_connection_info (samples),
			o (R .cond ([
				[x => R .length (R .keys (x)) !== 0,
					x => ({ connection: x })
				],
				[R .T,
					x => undefined
				]
			])))
	); 
};

var merge_classes = classes =>
	(! classes .length) ?
		classes
	:
		Oo (R .head (classes), 
			o (R .keys), 
			//merge classes by merge_index
			o (R .reduce ((classes, merge_index) =>
				//merge reduced classes with next class by merge_index
				Oo (classes, o (R .reduce ((classes, next) =>
					R .concat ( 
						//irrelvant classes
						Oo (classes, o (R .filter (class_ => 
							! R .intersection (class_ [merge_index], next [merge_index]) .length
						))),
						//classes to merge
						[Oo (classes,
							o (R .filter (class_ =>
								R .intersection (class_ [merge_index], next [merge_index]) .length
							)),
							o (x =>
								(! x .length) ?
									next
								: 
									Oo (R .keys (R .head (x)),
										o (R .map (q =>
											Oo (R .concat (x, [next]),
												o (R .map (x => x [q])),
												o (R .reduce (R .concat, [])),
												o (R .uniq)
											)
										))
									)
							)
						)]
					)
				, [])))
			, classes))
		)
;

var connection_to_classes = function (x) {
	var node_classes = (! x .connection) ?
			[]
		:
			Oo (x .connection,
				o (R .reduce (function (classes, next) {
					var next_as_class = next .map (x => [x])
					return merge_classes (R .concat (classes, [next_as_class]))
				}, [])))
	return Oo (x,
		o (R .omit (['connection'])),
		o (R .values),
		o (R .map (connection_to_classes)),
		o (R .reduce ((connections, next) =>
			merge_classes (R .concat (connections, next))
		, node_classes)))
};

var svg_with_dimensions = function (x) {
	return { $: x, width: + x .getAttribute ('width'), height: + x .getAttribute ('height') }
};

var svg_structure = svg =>
	Oo (svg .cloneNode (true),
		o (R .tap (Oo (R .__,
			o (x => Array .from (x .querySelectorAll ('defs'))),
			oO (R .forEach (defs => {
				defs .parentNode .removeChild (defs)
			}))
		))))
;

var reconnected_svg = function (svgs, connection_classes) {
	var reconnected_structures = svgs .map ((x, i) =>
		Oo (svg_structure (x),
			o (R .tap (function (x) {
				//[x .querySelectorAll ('[*|href]')]
				Oo (Array .from (x .querySelectorAll ('[xlink:href]')),
					oO (R .forEach (function (x) {
						var id = id_by_attr ('xlink:href') (x);

						if (id) {
							x .setAttribute ('xlink:href', R .find (Oo (R .__, o (x => x [i]), o (R .contains (id))), connection_classes) [0] [0]);
						}
					})))
				//[x .querySelectorAll ('[*|fill]')]
				Oo (Array .from (x .querySelectorAll ('[fill]')),
					oO (R .forEach (function (x) {
						var id = id_by_attr ('fill') (x);

						if (id) {
							x .setAttribute ('fill', 'url(' + R .find (Oo (R .__, o (x => x [i]), o (R .contains (id))), connection_classes) [0] [0] + ')');
						}
					})))
			}))
		)
	);
	var reconnected_defs = svgs .map (function (x, i) {
		var defs = x .querySelector ('defs') .cloneNode (true);
		var canon_defs = Oo (connection_classes,
			o (R .map (function (q) {
				return { canon_id: q [0] [0], represent: defs .querySelector (q [i] [0]) };
			}))
		);

		Oo (canon_defs, oO (R .forEach (x => {
			x .represent .setAttribute ('id', R .tail (x .canon_id));
		})));
		Oo (canon_defs,
			o (R .sort (function (a, b) {
				return a .canon_id > b .canon_id && +1
					|| a .canon_id === b .canon_id && 0
					|| a .canon_id < b .canon_id && -1
			})),
			o (R .map (x => x .represent)),
			oO (R .forEach (function (x) {
				defs .appendChild (x);
			})));
		Oo (Array .from (defs .children),
			o (R .reject (R .contains (R .__, canon_defs .map (x => x .represent)))),
			oO (R .forEach (function (x) {
				defs .removeChild (x);
			})));
		return defs;
	});
	var full_connections = merge_classes (R .concat (connection_classes, node_classes (reconnected_defs)));
	reconnected_defs .forEach (function (x, i) {
		//[x .querySelectorAll ('[*|href]')]
		Oo (Array .from (x .querySelectorAll ('[xlink:href]')),
			oO (R .forEach (function (x) {
				var id = id_by_attr ('xlink:href') (x);

				if (id) {
					x .setAttribute ('xlink:href', R .find (Oo (R .__, o (x => x [i]), o (R .contains (id))), full_connections) [0] [0]);
				}
			})));
		//[x .querySelectorAll ('[*|fill]')]
		Oo (Array .from (x .querySelectorAll ('[fill]')),
			oO (R .forEach (x => {
				var id = id_by_attr ('fill') (x);

				if (id) {
					x .setAttribute ('fill', 'url(' + R .find (Oo (R .__, o (x => x [i]), o (R .contains (id))), full_connections) [0] [0] + ')');
				}
			})));
	});
	return reconnected_structures .map (function (x, i) {
		x .appendChild (reconnected_defs [i]);
		return x;
	})
};

var node_classes = Oo (R .__, 
	node_connection_info,
	connection_to_classes
);

var svg_classes = Oo (R .__, 
	R .map (svg_structure),
	node_classes
);

var canonize_svg = function (svgs) {
	return reconnected_svg (svgs, svg_classes (svgs))
};

var svg_scale_info = function (svgs) {
	var canonicals = canonize_svg (svgs);
	return {
		svg: R .head (canonicals),
		scale: node_scale_info (canonicals .map (svg_with_dimensions))
	};
};

var ____scale_using = ____h => function (width_expr, height_expr) {
	return function (scale_info, dom) {
		return ____h ('dom',
			(_ => Oo (_ .scales,
				o (x => x || {}),
				o (R .toPairs),
				o (R .map (x => _ .key_serialize (x) + ':' + _ .val_serialize (x))),
				o (x => '{' + x .join (',') + '}' )
			))
				({
					scales: scale_info .scale,
					key_serialize: x => JSON .stringify (x [0]),
					val_serialize: Oo (R .__,
						o (x => x [1]),
						o (R .toPairs),
						o (R .map (x =>
							(x => x .i % 2 === 0 ?
								x .val .split ('`') .join ('\\`')
							:
								'${' + x .val [0] + '+' + x .val [1] + '*' + width_expr + '()' + '+' + x .val [2] + '*' + height_expr + '()' + '}'
							)
								({
									i: x [0],
									val: x [1]
								})
						)),
						o (x => '`' + x .join ('') + '`'))
				}), 
			(_ => Oo (_ .children,
				o (R .toPairs),
				o (R .map (x => _ .key_serialize (x) + ':' + _ .val_serialize (x))),
				o (x => '{' + x .join (',') + '}')
			))
				({
					children: Oo (scale_info, o (R .omit (['scale']))),
					key_serialize: x =>
						JSON .stringify (':nth-child(' + (+ (x [0]) + 1) + ')'),
					val_serialize: x =>
						`____scale_using (width_expr, height_expr) (scale_info [${x [0]}], dom .children [${x [0]}])`
				}),
			x => eval (x)
		)
	};
};

module .exports = ____h => ({
	svg_scale_info: svg_scale_info,
	____scale_using: ____scale_using (____h)
})
