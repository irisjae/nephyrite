var liquefied_dist = require ('./_config') .paths .uis .assets_dist;
var liquefied_prefix = liquefied_dist .slice (require ('./_config') .paths .dist .length + 1) + '/';

var hydrators = [];
var assets = [];
var serialize = function (x) {
	var i = R .indexOf (x, hydrators);
	if (i === -1) {
		hydrators .push (x);
		return '__hydrators [' + (hydrators .length - 1) + ']';
	}
	else
		return '__hydrators [' + i + ']';
};
var liquefy = function (x) {
	var i = R .indexOf (x, assets);
	if (i === -1) {
		assets .push (x);
		return liquefied_prefix + (assets .length - 1) + '.' + x .type;
	}
	else
		return liquefied_prefix + i + '.' + x .type;
};
