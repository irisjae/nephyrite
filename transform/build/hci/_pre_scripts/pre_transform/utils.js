var serve = function (x) {
	return x;
	return [x .cloneNode (true)]
		.map (R .tap (function (x) {
			x .setAttribute ('page', '');
		}))
		.map (R .tap (function (x) {
			//when debugging
			/*[] .forEach .call (x .querySelectorAll ('[example]'), function (_) {
				_ .outerHTML = '';
			})*/
		}))
	[0];
}

var native_array = function (x) {
	return [] .slice .call (x);
};
var assert = function (msg) {
	return function (x) {
		if (! x)
			throw new Error (msg + ' is false')
		else
			return x;
	}
};
