var Oo = require ('o-o-o-o-o') .Oo;
var o = require ('o-o-o-o-o') .o;
var R = require ('ramda');

var Node = require ('__window/Node');

var svg_tags = [ "a", "altGlyph", "altGlyphDef", "altGlyphItem", "animate", "animateColor", "animateMotion", "animateTransform", "circle", "clipPath", "color-profile", "cursor", "defs", "desc", "ellipse", "feBlend", "feColorMatrix", "feComponentTransfer", "feComposite", "feConvolveMatrix", "feDiffuseLighting", "feDisplacementMap", "feDistantLight", "feFlood", "feFuncA", "feFuncB", "feFuncG", "feFuncR", "feGaussianBlur", "feImage", "feMerge", "feMergeNode", "feMorphology", "feOffset", "fePointLight", "feSpecularLighting", "feSpotLight", "feTile", "feTurbulence", "filter", "font", "font-face", "font-face-format", "font-face-name", "font-face-src", "font-face-uri", "foreignObject", "g", "glyph", "glyphRef", "hkern", "image", "line", "linearGradient", "marker", "mask", "metadata", "missing-glyph", "mpath", "path", "pattern", "polygon", "polyline", "radialGradient", "rect", "script", "set", "stop", "style", "svg", "switch", "symbol", "text", "textPath", "title", "tref", "tspan", "use", "view", "vkern" ];

var capital_svg_tags = Oo (svg_tags, o (R .filter (x => x !== x .toLowerCase ())));
var unbuggy_svg_outer_html = x =>
	Oo (x .outerHTML,
		o (R .reduce ((html, tag) =>
			Oo (html,
				o (R .split ('<' + tag .toLowerCase ())),
				o (R .join ('<' + tag)),
				o (R .split ('</' + tag .toLowerCase ())),
				o (R .join ('</' + tag)))
		, R .__, capital_svg_tags))
	)
;




var rehydrators = [];
var dehydrate = js_value => x =>
	(x === undefined) ?
		'undefined'
	: (x === null) ?
		'null'
	: (x .constructor === String) ?
		'"' + x .replace (/"/g, '\\"') + '"'
	: (x .constructor === Number) ?
		String (x)
	: (x .constructor === Boolean) ?
		x ? 'true' : 'false'
	: (x .constructor === Array) ?
		'[ ' + x .reduce ((dehydrated, next) =>
			(next === undefined) ?
				R .concat (dehydrated, ['null'])
			:
				R .concat (dehydrated, [dehydrate (next)])
		, []) .join (', ') + ' ]'
	: (x .____pre_transformed) ?
		x .____pre_transformed
	: (R .is (Node) (x)) ?
		Oo (unbuggy_svg_outer_html (x),
			o (outer_html =>
				//checks if current tag needs to be parsed under svg namespace
				(! R .contains (x .tagName .toLowerCase ()) (['a', 'title', 'tspan', 'script', 'style'] .concat (svg_tags .map (function (x) {return x .toLowerCase ()})))) ?
					'frag (' + '`<svg>' + outer_html + '</svg>`' + ') .childNodes [0] .childNodes [0]'
				:
					'frag (' + '`' + outer_html + '`' + ') .childNodes [0]'),
			o (x => {
				var i = R .indexOf (x, rehydrators);
				if (i === -1) {
					rehydrators .push (x);
					return '' + (rehydrators .length - 1)
				}
				else
					return '' + i
			}),
			o (js_value))
	: (R .is (Object) (x)) ?
		'{ ' + Oo (Object .keys (x),
			o (R .reduce ((dehydrated, next) =>
				(x [next] === undefined) ?
					dehydrated
				:
					R .concat (
						dehydrated,
						[ dehydrate (next) + ':' + dehydrate (x [next]) ]
					)
			, [])),
			o (R .join (', ')))
		+ ' }'
	:
		'{}'
;



var assets = [];
var liquefy = image_url => Oo (R .__,
	x => {
		var i = R .indexOf (x .data, assets);
		if (i === -1) {
			assets .push (x);
			return (assets .length - 1) + '.' + x .type
		}
		else
			return i + '.' + x .type
	},
	image_url
);


module .exports = {
	js_value: js_value => ({
		dehydrate: dehydrate (js_value),
		rehydrators: rehydrators
	}),
	image_url: image_url => ({
		dehydrate: liquefy (image_url),
		rehydrators: assets
	})
};

