var strip_images = function (x) {
	[] .forEach .call (x .querySelectorAll ('image'), function (y) {
		var href = y .getAttribute ('xlink:href');
		var decoded = decode_base64 (href);
		if (decoded) {
			y .setAttribute ('xlink:href', liquefy (decoded))
		}
	});
};

var decode_base64 = function (x) {
	var matches = x .match (/^data:([A-Za-z-+\/]+);base64,(.+)$/);
	if (matches) {
		var data = {};

		if (matches .length !== 3) {
			throw new Error ('Invalid input string');
		}

		data .type = matches [1] .match (/\/(.*?)$/) [1];
		data .data = new Buffer (matches [2], 'base64');

		return data;
	}
}
