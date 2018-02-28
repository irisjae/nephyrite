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
