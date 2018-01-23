var scale_info = function (base, aux_1, aux_2) {
	return _scale_info (
		{
			_: base,
			width: + base .getAttribute ('width'),
			height: + base .getAttribute ('height')
		},
		{
			_: aux_1,
			width: + aux_1 .getAttribute ('width'),
			height: + aux_1 .getAttribute ('height')
		},
		{
			_: aux_2,
			width: + aux_2 .getAttribute ('width'),
			height: + aux_2 .getAttribute ('height')
		})
}

var scale_flux = function (sample_0, sample_1, sample_2) {
	var dx1 = sample_1 .width - sample_0 .width;
	var dx2 = sample_2 .width - sample_0 .width;
	var dy1 = sample_1 .height - sample_0 .height;
	var dy2 = sample_2 .height - sample_0 .height;
	var dv1 = sample_1 ._ - sample_0 ._;
	var dv2 = sample_2 ._ - sample_0 ._;
	
	var x_flux = (dy2 * dv1 - dy1 * dv2) / (dx1 * dy2 - dy1 * dx2)
	var y_flux = (dx1 * dv2 - dx2 * dv1) / (dx1 * dy2 - dy1 * dx2)
	
	return {
		x_flux: x_flux,
		y_flux: y_flux
	};
	//(z1 - z0) = c1 (y1 - y0) + c2 (x1 - x0)
	//(z2 - z0) = c1 (y2 - y0) + c2 (x2 - x0)

	//(z - z0) = c1 (y - y0) + c2 (x - x0)
	/*
	
	
	  x1-x0 y1-y0    c1     z1-z0
	                     =      
	  x2-x0 y2-y0    c2     z2-z0
      
      
      c1         1       y2-y0 y0-y1    z1-z0
          =  ---------
      c2     (       )   x0-x2 x1-x0    z2-z0

	*/
}
var _scaled_val = function (sample_0, sample_1, sample_2) {
	sample_0 ._ = sample_0 ._ .split (/(-?\d+(?:\.\d+)?(?:e-?\d+)?)/) .map (function (v, i) { if (i % 2 === 1) return + v; else return v });
	sample_1 ._ = sample_1 ._ .split (/(-?\d+(?:\.\d+)?(?:e-?\d+)?)/) .map (function (v, i) { if (i % 2 === 1) return + v; else return v });
	sample_2 ._ = sample_2 ._ .split (/(-?\d+(?:\.\d+)?(?:e-?\d+)?)/) .map (function (v, i) { if (i % 2 === 1) return + v; else return v });
	var base_numbers = sample_0 ._ .filter (function (v, i) {
		return i % 2 === 1;
	});
	return base_numbers .reduce (function (sum, next, k) {
		var i = 2 * k + 1;
		if (next === sample_1 ._ [i] && next === sample_2 ._ [i]) {
			return R .adjust (R .concat (R .__, '' + next + sample_0 ._ [i + 1])) (sum .length - 1) (sum)
		}
		else {
			var fluxes = scale_flux ({
					_: next,
					width: sample_0 .width,
					height: sample_0 .height
				}, {
					_: sample_1 ._ [i],
					width: sample_1 .width,
					height: sample_1 .height
				}, {
					_: sample_2 ._ [i],
					width: sample_2 .width,
					height: sample_2 .height
				}
			);
			return sum .concat ([[next, fluxes .x_flux, fluxes .y_flux], sample_0 ._ [i + 1]]);
		}
	}, base_numbers .length ? [sample_0 ._ [0]] : [])
};

var _scale_info = function (sample_0, sample_1, sample_2) {
	return R .merge (
		[sample_0 ._ .attributes]
			.map (native_array)
			.map (R .map (function (attr) {
				var name = attr .nodeName;
				var val = attr .nodeValue;
				var val_1 = sample_1 ._ .getAttribute (name);
				var val_2 = sample_2 ._ .getAttribute (name);
				if (val !== val_1 || val !== val_2) {
					return [name, _scaled_val (
						{
							_: val,
							width: sample_0 .width,
							height: sample_0 .height
						},
						{
							_: val_1,
							width: sample_1 .width,
							height: sample_1 .height
						},
						{
							_: val_2,
							width: sample_2 .width,
							height: sample_2 .height
						}
					)]
				}
			}))
			.map (R .filter (R .identity))
			.map (R .fromPairs)
			.map (R .cond ([
				[R .pipe (R .keys, R .length, R .equals (0), R .not), R .objOf ('scale')],
				[R .T, R .always ({})]
			]))
		[0]
	) ([sample_0 ._ .children]
		.map (native_array)
		.map (R .addIndex (R .map) (function (child, i) {
			return _scale_info ({
					_: child,
					width: sample_0 .width,
					height: sample_0 .height
				}, {
					_: assert ('sample 1 matches') (sample_1 ._ .children [i]),
					width: sample_1 .width,
					height: sample_1 .height
				}, {
					_: assert ('sample 2 matches') (sample_2 ._ .children [i]),
					width: sample_2 .width,
					height: sample_2 .height
				}
			)
		}))
		.map (R .addIndex (R .map) (function (x, i) {
			return [i, x]
		}))
		.map (R .filter (R .pipe (R .prop (1), R .keys, R .length)))
		.map (R .fromPairs)
	[0])
};

var mark_scale = function (info, dom) {
	var dom_ = dom .cloneNode (true);
	[info]
		.map (R .omit (['scale']))
//		.forEach (R .)
	return dom_;
};
