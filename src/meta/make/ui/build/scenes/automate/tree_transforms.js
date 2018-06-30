var Oo = require ('o-o-o-o-o') .Oo;
var o = require ('o-o-o-o-o') .o;
var oO = require ('o-o-o-o-o') .oO;
var R = require ('ramda');

var walk_dom = require ('./tree_utils') .walk_dom;
var uuid = require ('uuid/v4');

var recitify = dom => {
	Oo (Array .from (dom .querySelectorAll ('[id*="/"]')),
		oO (R .forEach (function (node) {
			var id = node .getAttribute ('id');
			var parts = id .split (' ');
			if (parts [0] [0] !== '/') {
				node .setAttribute ('id', parts [0]);
				var attribute_string = parts .slice (1) .join (' ');
			}
			else {
				var attribute_string = id;
			}
			
			while (attribute_string) {
				var next_attribute = /^\/([^"/ =]+?)(?:=([^"/ ]+?)|="([^"]+?)")?(?=\s|$)/ .exec (attribute_string);
				if (! next_attribute)
					throw new Error ('invalid attribute string ' + id);
				else {
					var name = next_attribute [1];
					var value = next_attribute [2] || next_attribute [3] || '';
					node .setAttribute (name, value);
					attribute_string = attribute_string .slice (next_attribute [0] .length);
					if (attribute_string [0] === ' ')
						attribute_string = attribute_string .slice (1);
				}
			}
		})))
}
var uniqify = function (dom) {
	var prefix = 'x-' + uuid () + '-';
	var defs = dom .querySelector ('defs');
	var ids = Oo (defs .children, o (R .map (def =>
		def .getAttribute ('id')
	)));
	Oo (defs .children,
		o (Array .from),
		oO (R .forEach (def =>
			def .setAttribute ('id', prefix + def .getAttribute ('id'))
		)));
	walk_dom (dom, node => {
		Oo (Array .from (node .attributes), oO (R .forEach (function (attribute) {
			ids .forEach (function (id) {
				if (attribute .nodeValue .includes ('#' + id))
					node .setAttribute (
						attribute .nodeName,
						attribute .nodeValue .split ('#' + id) .join ('#' + prefix + id)
					)
			})
		})))
	})
}

var exemplify = function (instances, processing) {
	var list = [] .slice .call (instances) .reverse ();
	var x = list [0];
	if (processing && ! processing .apply) processing [0] (list);
	list .slice (1) .forEach (function (u) {
		u .outerHTML = '';
	})
	if (processing && ! processing .apply) processing [1] (x);
	else if (processing) processing (x);
	/*[] .forEach .call (x .querySelectorAll ('[example]'), function (y) {
		y .outerHTML = '';
	});*/
	return x;
}

module .exports = {
	recitify: recitify,
	uniqify: uniqify,
	exemplify: exemplify,
};
