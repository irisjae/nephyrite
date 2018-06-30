var Oo = require ('o-o-o-o-o') .Oo;
var oO = require ('o-o-o-o-o') .oO;
var R = require ('ramda');

var Buffer = require ('buffer') .Buffer;

module .exports = liquefy => {
	var strip_images = x => {
		Oo (Array .from (x .querySelectorAll ('image')),
			oO (R .forEach (x => {
				var href = x .getAttribute ('xlink:href');
				var decoded = decode_base64 (href);
				if (decoded) {
					x .setAttribute ('xlink:href', liquefy (decoded))
				}
			})));
	};

	var decode_base64 = function (x) {
		var matches = x .match (/^data:([A-Za-z-+/]+);base64,(.+)$/);
		if (matches) {
			var data = {};

			if (matches .length !== 3) {
				throw new Error ('Invalid input string');
			}

			data .type = matches [1] .match (/\/(.*?)$/) [1];
			data .data = Buffer .from (matches [2], 'base64');

			return data;
		}
	}

	return strip_images
}
