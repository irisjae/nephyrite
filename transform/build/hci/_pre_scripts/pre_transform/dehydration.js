var svg_tags = [ "a", "altGlyph", "altGlyphDef", "altGlyphItem", "animate", "animateColor", "animateMotion", "animateTransform", "circle", "clipPath", "color-profile", "cursor", "defs", "desc", "ellipse", "feBlend", "feColorMatrix", "feComponentTransfer", "feComposite", "feConvolveMatrix", "feDiffuseLighting", "feDisplacementMap", "feDistantLight", "feFlood", "feFuncA", "feFuncB", "feFuncG", "feFuncR", "feGaussianBlur", "feImage", "feMerge", "feMergeNode", "feMorphology", "feOffset", "fePointLight", "feSpecularLighting", "feSpotLight", "feTile", "feTurbulence", "filter", "font", "font-face", "font-face-format", "font-face-name", "font-face-src", "font-face-uri", "foreignObject", "g", "glyph", "glyphRef", "hkern", "image", "line", "linearGradient", "marker", "mask", "metadata", "missing-glyph", "mpath", "path", "pattern", "polygon", "polyline", "radialGradient", "rect", "script", "set", "stop", "style", "svg", "switch", "symbol", "text", "textPath", "title", "tref", "tspan", "use", "view", "vkern" ];
var capital_svg_tags = svg_tags .filter (function (x) {
	return x !== x .toLowerCase ()
});

var unbuggy_svg_outer_html = function (x) {
	return [x .outerHTML]
		.map (R .reduce (function (html, tag) {
			return html
				.split ('<' + tag .toLowerCase ()) .join ('<' + tag)
				.split ('</' + tag .toLowerCase ()) .join ('</' + tag);
		}, R .__, capital_svg_tags))
	[0];
};


var dehydrate = function (x) {
	if (x === undefined)
		return 'undefined';
	else if (x === null)
		return 'null';
	else if (x .constructor === String)
		return '"' + x .replace (/"/g, '\\"') + '"';
	else if (x .constructor === Number)
		return String (x)
	else if (x .constructor === Boolean)
		return x ? 'true' : 'false'
	else if (x .constructor === Array)
		return '[ ' + x .reduce (function (dehydrated, next) {
			if (next === undefined)
				return dehydrated .concat (['null'])
			else
				return dehydrated .concat ([dehydrate (next)])
		}, []) .join (', ') + ' ]'
	else if (x .____pre_transformed)
		return x .____pre_transformed
	else if (R .is (Node) (x)) {
		var outer_html = unbuggy_svg_outer_html (x);
		//checks if current tag needs to be parsed under svg namespace
		if (! R .contains (x .tagName .toLowerCase ()) (['a', 'title', 'tspan', 'script', 'style'] .concat (svg_tags .map (function (x) {return x .toLowerCase ()})))) 
			var rehydration = 'frag (' + '`<svg>' + outer_html + '</svg>`' + ') .childNodes [0] .childNodes [0]'
		else
			var rehydration = 'frag (' + '`' + outer_html + '`' + ') .childNodes [0]'

		return serialize (rehydration);
	}
	else if (R .is (Object) (x))
		return '{ ' + Object .keys (x) .reduce (function (dehydrated, next) {
			if (x [next] === undefined)
				return dehydrated
			else
				return dehydrated .concat (
					[dehydrate (next) + ':' + dehydrate (x [next])]
				);
		}, []) .join (', ') + ' }'
	else
		return '{}'
};
