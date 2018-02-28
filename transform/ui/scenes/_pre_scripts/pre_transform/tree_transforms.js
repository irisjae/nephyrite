var recitify = function (dom) {
	[] .forEach .call (dom .querySelectorAll ('[id*="/"]'), function (node) {
		var id = node .getAttribute ('id');
		var parts = id .split (' ');
		if (parts [0] [0] !== '/') {
			node .setAttribute ('id', parts [0]);
			var attribute_string = parts .slice (1) .join (' ');
		}
		else {
			var attribute_string = id;
		}
		
		var attributes = [];
		
		while (attribute_string) {
			var next_attribute = /^\/([^"/ =]+)(?:=([^"/ ]+)|="([^"/]+)")?/ .exec (attribute_string);
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
	})
}
var uniqify = function (dom) {
	var prefix = 'x-' + require ('uuid/v4') () + '-';
	var defs = dom .querySelector ('defs');
	var ids = [] .map .call (defs .children, function (def) {
		return def .getAttribute ('id');
	});
	[] .forEach .call (defs .children, function (def) {
		return def .setAttribute ('id', prefix + def .getAttribute ('id'));
	});
	walk_dom (dom, function (node) {
		[] .forEach .call (node .attributes, function (attribute) {
			ids .forEach (function (id) {
				if (attribute .nodeValue .includes ('#' + id))
					node .setAttribute (
						attribute .nodeName,
						attribute .nodeValue .split ('#' + id) .join ('#' + prefix + id)
					)
			})
		})
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
