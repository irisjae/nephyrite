var node_children_collect = function (samples, info_collect) {
	return [samples [0] .children]
		.map (native_array)
		.map (R .addIndex (R .map) (info_collect))
		.map (R .addIndex (R .map) (function (x, i) {
			return [i, x]
		}))
		.map (R .filter (R .pipe (R .prop (1), R .keys, R .length)))
		.map (R .fromPairs)
	[0]
};

var scale_flux = function (x) {
	var dx1 = x [1] .width - x [0] .width;
	var dx2 = x [2] .width - x [0] .width;
	var dy1 = x [1] .height - x [0] .height;
	var dy2 = x [2] .height - x [0] .height;
	var dv1 = x [1] ._ - x [0] ._;
	var dv2 = x [2] ._ - x [0] ._;
	
	var x_flux = (dy2 * dv1 - dy1 * dv2) / (dx1 * dy2 - dy1 * dx2)
	var y_flux = (dx1 * dv2 - dx2 * dv1) / (dx1 * dy2 - dy1 * dx2)
	
	return {
		x_flux: x_flux,
		y_flux: y_flux
	};
}

var val_scale_info = function (samples) {
	var number_breakdowns = samples .map (number_breakdown_from_val);
	var base_numbers = number_breakdowns [0] .filter (function (v, i) {
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
				var fluxes = scale_flux (samples .map (function (sample, l) {
					return R .merge (sample, {
						_: number_breakdowns [l] [i]
					})
				}));
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
	var number_breakdown_from_val = R .pipe (R .prop ('_'), val_string_break);

var element_scale_info = function (samples) {
	return [samples [0] ._ .attributes]
		.map (native_array)
		.map (R .map (R .prop ('nodeName')))
		.map (R .chain (function (name) {
			var vals = samples .map (R .evolve ({
				_: function (_) {
					return _ .getAttribute (name);
				}
			}));
			if (vals [0] ._ == vals [1] ._ && vals [1] ._ == vals [2] ._) 
				return [];
			else
				return [[name, val_scale_info (vals)]]
		}))
		.map (R .fromPairs)
	[0]
};

var node_children_scale_info = function (samples) {
	return node_children_collect (samples .map (R .prop ('_')), function (child, i) {
		return node_scale_info (samples .map (R .evolve ({
			_: R .pipe (R .prop ('children'), R .nth (i))
		})))
	});
};

var node_scale_info = function (samples) {
	return R .merge (
		node_children_scale_info (samples),
		[element_scale_info (samples)]
			.map (R .cond ([
				[R .pipe (R .keys, R .length, R .equals (0), R .not),
					 R .objOf ('scale')
				]
			]))
		[0]
	)
};

/*
var def_node_scale_info = function (samples) {
	return node_children_collect (samples, function (child) {
		var def_id = child .getAttribute ('id');
		return node_scale_info ([
			{ _: child, width: samples [0] .width, height: samples [0] .height },
			// HACK: sometimes stretched svgs have different connections, so || child after get selector
			{ _: assert ('sample 1 matches') (samples [1] ._ .querySelector ('#' + def_id) || child), width: samples [1] .width, height: samples [1] .height },
			{ _: assert ('sample 2 matches') (samples [2] ._ .querySelector ('#' + def_id) || child), width: samples [2] .width, height: samples [2] .height }
		])
	});
};

var defs_scale_info = function (samples) {
	return R .merge (
		def_node_scale_info (samples),
		[element_scale_info (samples)]
			.map (R .cond ([
				[R .pipe (R .keys, R .length, R .equals (0), R .not),
					 R .objOf ('scale')
				]
			]))
		[0]
	)
};
*/

var id_by_attr = function (name) {
	return R .pipe (
		function (x) {
			return x .getAttribute (name);
		},
		(name === 'xlink:href') && R .match (/^(#[^]+)$/)
			|| (name === 'fill') && R .match (/^url\((#[^)]+)\)$/),
		R .nth (1)
	)
};

var element_connection_info = function (samples) {
	return [samples [0] .attributes]
		.map (native_array)
		.map (R .map (R .prop ('nodeName')))
		.map (R .filter (R .contains (R .__, [ 'xlink:href', 'fill' ])))
		.map (R .map (function (name) {
			return samples .map (id_by_attr (name));
		}))
		.map (R .chain (function (ids) {
			if (! R .all (R .identity) (ids))
				return [];
			else
				return [ids];
		}))
	[0]
};

var node_children_connection_info = function (samples) {
	return node_children_collect (samples, function (child, i) {
		return node_connection_info (samples
			.map (R .pipe (R .prop ('children'), R .nth (i)))
			.map (R .tap (function (x, i) {
				assert ('sample ' + i + ' connection matches') (x);
			}))
		)
	})
};

var node_connection_info = function (samples) {
	return R .merge (
		node_children_connection_info (samples),
		[element_connection_info (samples)]
			.map (R .cond ([
				[R .pipe (R .keys, R .length, R .equals (0), R .not),
					 R .objOf ('connection')
				]
			]))
		[0]
	); 
};

var merge_classes = function (classes) {
	if (! classes .length)
		return classes;
	else
		return [classes [0]] 
			.map (R .keys) 
			//merge classes by merge_index
			.map (R .reduce (function (classes, merge_index) {
				//merge reduced classes with next class by merge_index
				return [classes] .map (R .reduce (function (classes, next) {
					return R .concat ( 
						//irrelvant classes
						[classes] .map (R .filter (function (class_) { 
							return ! R .intersection (class_ [merge_index], next [merge_index]) .length
						})) [0],
						//classes to merge
						[[classes]
							.map (R .filter (function (class_) {
								return R .intersection (class_ [merge_index], next [merge_index]) .length
							}))
							.map (function (x) { 
								return ! x .length ?
									next
								: 
									[x [0]]
										.map (R .keys)
										.map (R .map (function (q) {
											return [R .concat (x, [next])]
												.map (R .map (R .nth (q)))
												.map (R .reduce (R .concat, []))
												.map (R .uniq)
											[0]
										}))
									[0]
							})
						[0]]
					)
				}, [])) [0];
			}, classes))
		[0];
};

var connection_to_classes = function (x) {
	var node_classes = ! x .connection ?
			[]
		:
			 [x .connection]
				.map (R .reduce (function (classes, next) {
					return R .identity (function (_) {
						return merge_classes (R .concat (classes, [_ .next_as_class]))
					} ({
						next_as_class: next .map (function (x) { return [x]; })
					})) 
				}, []))
			[0];
	return [x]
		.map (R .omit (['connection']))
		.map (R .values)
		.map (R .map (connection_to_classes)) 
		.map (R .reduce (function (connections, next) {
			return merge_classes (R .concat (connections, next))
		}, node_classes))
	[0]
};

var svg_with_dimensions = function (x) {
	return { _: x, width: + x .getAttribute ('width'), height: + x .getAttribute ('height') }
};

var svg_structure = function (svg) {
	var undefed = svg .cloneNode (true);
	[undefed .querySelectorAll ('defs')]
		.map (native_array)
		.forEach (R .forEach (function (defs) {
			defs .parentNode .removeChild (defs);
		}));
	return undefed;	
};

var reconnected_svg = function (svgs, connection_classes) {
	var reconnected_structures = svgs .map (function (x, i) {
		return [svg_structure (x)]
			.map (R .tap (function (x) {
				//[x .querySelectorAll ('[*|href]')]
				[x .querySelectorAll ('[xlink:href]')]
					.map (native_array)
					.forEach (R .forEach (function (x) {
						var id = id_by_attr ('xlink:href') (x);

						if (id) {
							x .setAttribute ('xlink:href', R .find (R .pipe (R .nth (i), R .contains (id)), connection_classes) [0] [0]);
						}
					}));
				//[x .querySelectorAll ('[*|fill]')]
				[x .querySelectorAll ('[fill]')]
					.map (native_array)
					.forEach (R .forEach (function (x) {
						var id = id_by_attr ('fill') (x);

						if (id) {
							x .setAttribute ('fill', 'url(' + R .find (R .pipe (R .nth (i), R .contains (id)), connection_classes) [0] [0] + ')');
						}
					}));
			}))
		[0];
	});
	var reconnected_defs = svgs .map (function (x, i) {
		var defs = x .querySelector ('defs') .cloneNode (true);
		var canon_defs = [connection_classes]
			.map (R .map (function (q) {
				return { canon_id: q [0] [0], represent: defs .querySelector (q [i] [0]) };
			}))
		[0];

		canon_defs .forEach (function (_) {
			_ .represent .setAttribute ('id', R .tail (_ .canon_id));
		});
		[canon_defs]
			.map (R .sort (function (a, b) {
				return a .canon_id > b .canon_id && +1
					|| a .canon_id === b .canon_id && 0
					|| a .canon_id < b .canon_id && -1
			}))
			.map (R .map (R .prop ('represent')))
			.forEach (R .forEach (function (_) {
				defs .appendChild (_);
			}));
		[defs .children]
			.map (native_array)
			.map (R .reject (R .contains (R .__, canon_defs .map (R .prop ('represent')))))
			.forEach (R .forEach (function (_) {
				defs .removeChild (_);
			}));
		return defs;
	});
	var full_connections = merge_classes (R .concat (connection_classes, node_classes (reconnected_defs)));
	reconnected_defs .forEach (function (x, i) {
		//[x .querySelectorAll ('[*|href]')]
		[x .querySelectorAll ('[xlink:href]')]
			.map (native_array)
			.forEach (R .forEach (function (x) {
				var id = id_by_attr ('xlink:href') (x);

				if (id) {
					x .setAttribute ('xlink:href', R .find (R .pipe (R .nth (i), R .contains (id)), full_connections) [0] [0]);
				}
			}));
		//[x .querySelectorAll ('[*|fill]')]
		[x .querySelectorAll ('[fill]')]
			.map (native_array)
			.forEach (R .forEach (function (x) {
				var id = id_by_attr ('fill') (x);

				if (id) {
					x .setAttribute ('fill', 'url(' + R .find (R .pipe (R .nth (i), R .contains (id)), full_connections) [0] [0] + ')');
				}
			}));
	});
	return reconnected_structures .map (function (x, i) {
		x .appendChild (reconnected_defs [i]);
		return x;
	})
};

var node_classes = R .pipe (
	node_connection_info,
	connection_to_classes
);

var svg_classes = R .pipe (
	R .map (svg_structure),
	node_classes
);

var canonize_svg = function (svgs) {
	return reconnected_svg (svgs, svg_classes (svgs))
};

var svg_scale_info = function (svgs) {
	var canonicals = canonize_svg (svgs);
	return {
		svg: canonicals [0],
		scale: node_scale_info (canonicals .map (svg_with_dimensions))
	};
};

var scale_using = function (width_expr, height_expr) {
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
							(_ => _ .i % 2 === 0 ?
								_ .val .split ('`') .join ('\\`')
							:
								'${' + _ .val [0] + '+' + _ .val [1] + '*' + width_expr + '()' + '+' + _ .val [2] + '*' + height_expr + '()' + '}'
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
						`scale_using (width_expr, height_expr) (scale_info [${x [0]}], dom .children [${x [0]}])`
				}),
			x => eval (x)
		)
	};
};

macro (recursive_pre_transform (calls_ ('scale_using'), (src, args) =>
	`scale_using (${args .map (x => JSON .stringify (x, null, 4)) .join (',')})`
));
