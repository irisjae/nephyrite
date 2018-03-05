var hint_use = require ('./tree_utils') .hint_use;
var use_bounds = require ('./tree_utils') .use_bounds;

var input_ify = function (hint) {
	var use = hint_use (hint .querySelector ('g'));
	var bounding_box = use_bounds (use)
	
	return '<rect ' +
		'transform="' + use .getAttribute ('transform') + '" ' +
		'width="' + (bounding_box .x_max - bounding_box .x_min) + '" ' +
		'height="' + (bounding_box .y_max - bounding_box .y_min) + '" ' +
		'fill-opacity="0.001"' +
	'>' +
		'<animate attributeName="fill" from="black" to="blue" dur="1s" repeatCount="indefinite" />' +
	'</rect>' +
	'<foreignObject ' +
		'style="' + hint .getAttribute ('style')+ '; display: block;" ' +
		'transform="' + use .getAttribute ('transform') + '" ' +
		'width="' + (bounding_box .x_max - bounding_box .x_min) + '" ' +
		'height="' + (bounding_box .y_max - bounding_box .y_min) + '" ' +
	'>' +
		'<overflow-clip ' +
			'style="' + 
				'padding: 0;' +
				'background: transparent;' + 
				'width: 100%;' +
				'height: 100%;' + 
				'overflow: hidden;' + 
				'z-index: 9999;' + 
				'display: flex;' + 
				'flex-direction: column;' +
				'align-content: space-around;' +
		'">' +
			'<input ' +
				([] .filter .call (hint .attributes, function (attr) { return attr .nodeName !== 'style' })
					.map (function (attr) {
						return attr .nodeName + '="' + attr .nodeValue + '"'
					}
				) .join (' ')) + ' ' +
				'style="' +
					'outline: none;' + 
					'border: none;' + 
					'padding: 0px;' + 
					'margin: 0px;' + 
					'display: block;' +
					'background: transparent;' +
					'width: 1e+07vw;' + 
					'-webkit-appearance: none;' +
			'">' +
		'</overflow-clip>' +
	'</foreignObject>';
};
var text_ify = function (hint, text) {
	text = text || '';
	
	var use = hint_use (hint);
	var bounding_box = use_bounds (use)
	
	return '<foreignObject ' +
		([] .map .call (
			hint .attributes,
			function (attr) {
				return attr .nodeName + '="' + attr .nodeValue + '"'
			}
		) .join (' ')) + ' ' +
		'transform="' + use .getAttribute ('transform') + '" ' +
		'width="' + (bounding_box .x_max - bounding_box .x_min) + '" ' +
		'height="' + (bounding_box .y_max - bounding_box .y_min) + '" ' +
	'>' +
		'<positioner text style="' + (hint .getAttribute ('positioner-style') || '') + '">' +
			text .replace (/&/g, "&amp;") .replace (/</g, "&lt;") .replace (/>/g, "&gt;") +
		'</positioner>' +
	'</foreignObject>';
};
var image_ify = function (hint, src) {
	var use = hint_use (hint);
	var bounding_box = use_bounds (use)
	
	return '<foreignObject ' +
		([] .filter .call (hint .attributes, function (attr) { return attr .nodeName !== 'style' })
			.map (function (attr) {
				return attr .nodeName + '="' + attr .nodeValue + '"'
			}
		) .join (' ')) + ' ' +
		'transform="' + use .getAttribute ('transform') + '" ' +
		'width="' + (bounding_box .x_max - bounding_box .x_min) + '" ' +
		'height="' + (bounding_box .y_max - bounding_box .y_min) + '" ' +
	'>' +
		'<positioner style="' + (hint .getAttribute ('positioner-style') || '') + '">' +
			(src ?
				'<img src="' + src + '" style="' + (hint .getAttribute ('style') || '') + '">' :
				'<img style="' + (hint .getAttribute ('style') || '') + '">'
			) +
		'</positioner>' +
	'</foreignObject>';
};
var fulfill_scroll = function (scroll) {
	var hinted = scroll .parentElement;
	
	var use = hint_use (scroll);
	var transform = use .getAttribute ('transform');
	var bounding_box = use_bounds (use);
	if (transform && transform .startsWith ('translate(')) {
		var translation = transform .slice ('translate(' .length, transform .indexOf (')'));
		var numbers = translation .split (' ') .map (function (x) {
			return +x;
		})
		bounding_box .x_min += numbers [0];
		bounding_box .x_max += numbers [0];
		bounding_box .y_min += numbers [1];
		bounding_box .y_max += numbers [1];
	}
	
	scroll .outerHTML = '';
	
	hinted .setAttribute ('scroll-x-min', bounding_box .x_min);
	hinted .setAttribute ('scroll-x-max', bounding_box .x_max);
	hinted .setAttribute ('scroll-y-min', bounding_box .y_min);
	hinted .setAttribute ('scroll-y-max', bounding_box .y_max);
};

module .exports = {
	input_ify: input_ify,
	text_ify: text_ify,
	image_ify: image_ify,
	fulfill_scroll: fulfill_scroll
};
