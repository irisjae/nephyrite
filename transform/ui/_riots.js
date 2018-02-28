var R = require ('ramda');
var jsdom = require ('jsdom');
var compiler = require ('riot-compiler');
var path = require ('path');
var file = require ('./_util') .file;

var scripts_src = require ('./_config') .paths .scripts .src;
var scripts_pre = require ('./_config') .paths .scripts .pre;

var window = (new jsdom .JSDOM ()) .window;

var indent = function (string) {
	return '\t' + string .split ('\n') .join ('\n\t');
};

var info = {
	name_resolution: {},
	metastyles_resolution: {}
};
						
var transform = function (src, name) {
	var subcomponents = {};
	var expressions = [];
	var eaches
	var loop_expressions = [];
	var scripts = [];
	var prescripts = [];
	var refs = /<[^>]+ ref=[^>]+>/ .test (src);
	var yield_tag = /<yield \/>/ .test (src);
	
	return ['<' + name + '>' + '\n' +
				indent (src) + '\n' +
			'</' + name + '>']
		/* Resolve & tags */
		.map (function (def) {
			var and_potential = true;
			var resolve_and =	function (match, parent, _yield) {
									and_potential = true;
									if (! info .name_resolution [parent])
										throw 'unresolved inheritance: ' + parent
									else
										return	file (info .name_resolution [parent] [0])
													.replace (/<yield \/>/g, function (match) {
														return _yield;
													});
								}
			while (and_potential) {
				and_potential = false;
				def = def
						.replace (/<&([^>\/\s]+)\s*>((?:(?!<\/&>)[^])+)<\/&>/g, resolve_and)
						.replace (/<&([^>\/\s]+)\s*()\/\s*>/g, resolve_and);
			}
			return def;
		})
		/* & tags erasure */
		.map (function (def) {
			return def .replace (/<&(?:[^>]*)>|<& \/>|<&\/>|<\/&>/g, function (match) {
				return '';
			})
		})
		/* Extract styles */
		.map (function (def) {
			return def .replace (/<style>((?:(?!<\/)[^])*)<\/style>/g, function (match, metastyles) {
				//styles .extend (tag_name, metastyles, parent_name);
				info .metastyles_resolution [name] = (info .metastyles_resolution [name] || []) .concat ([metastyles]);
				return '';
			})
		})
		/* Extract pre transforms  */
		.map (function (def) {
			return def .replace (/<script>\s*pre\s*(\(function\s*\((?:(?!<\/script>)[^)])*\)\s*\{(?:(?!<\/script>)[^])*}\))\s*<\/script>/g, function (match, prescript) {
				prescripts .push (prescript);
				return '';
			})
		})
		/* Extract scripts  */
		.map (function (def) {
			return def .replace (/<script>((?:(?!<\/script>)[^])*)<\/script>/g, function (match, metascript) {
				scripts .push (metascript);
				return '';
			})
		}) 
		/* Execute pre transforms  */
		.map (function (def) {
			if (prescripts .length) {
				with (require ('./util')) {
					(function () {
						var _name = name;//HACK: half hack. in window, name will become window .name, so use _name;
						with (window) {
							var node/* = (function (html) {
								var container = document .createElement ('template');
								container .innerHTML = html;
								return container .content;
							}) (def) .childNodes [0]*/;
							eval (file (scripts_pre));
							serve = R .pipe (serve, function (node) {
								return '<' + _name + '>' + '\n' +
									indent (node .outerHTML) + '\n' +
								'</' + _name + '>'
							});
							for (var _ in prescripts) {
								eval (prescripts [_]) (node);
							}
							//def = node .outerHTML;
						}
					}) ();
				}
			}
			return def;
		})
		/* Transform expressions  */
		.map (function (def) {
			return def .replace (/{((?=(?:(?:(?!\ in )[^({])*\()+(?:(?!\ in )[^({])*\ in[^{]+})(?:[^{]+)|(?:(?!\ in )[^{])+)}/g, function (match, expression) {
				expressions .push (expression);
				return '{ expression:' + name + ':' + expressions .length + ' }';
			})
		})
		/* Transform looper expressions  */
		.map (function (def) {
			return def .replace (/{((?:(?!\ in )[^{])*)\ in ([^{]+)}/g, function (match, loop_syntax, expression) {
				expressions .push (expression);
				return '{' + loop_syntax + ' in expression:' + name + ':' + expressions .length + ' }';
			})
		})
		/* Transform ref expressions  */
		.map (function (def) {
			return def .replace (/(<[^>]+ ref=")([^">]+)("[^>]*>)/g, function (match, before, ref, after) {
				return before + '{ ref prefix }' + ref + after;
			})
		})
		/* Inject scripts  */
		.map (function (def) {
			return def .replace (/\n<\/[^]+>$/g, function (match) {
				return ((scripts .length || expressions .length || yield_tag || refs) ?
					indent ('<script>\n(function (self, args) {\n'
						+ '\n self ._loaded = true;'
						+ '\n self ._scope = function () {};'
						/*+ '\n self .on ("before-mount", function () { log ("' + tag_name + ' enter mount"); });'
						+ '\n self .on ("mount", function () { log ("' + tag_name + ' exit mount"); });'
						+ '\n self .on ("update", function () { log ("' + tag_name + ' enter update"); });'
						+ '\n self .on ("updated", function () { log ("' + tag_name + ' exit update"); });'*/
						+ (yield_tag
							? '\nself ._yield_levels = 0;'
								+ '\nself ._yield_level = 0;'
								+ '\nself ._yield_on = function () { /*log ("' + name + ' yield enter");*/ self ._yielding = true; self ._yield_level++; if (self ._yield_level > self ._yield_levels) self ._yield_levels = self ._yield_level; return ""; };'
								+ '\nself ._yield_off = function () { /*log ("' + name + ' yield exit");*/ self ._yielding = false; self ._yield_level--; return ""; };'
							: '')
						+ (yield_tag
							? '\nvar _refs = [mergeAll ([ from (function (when) { self .on ("mount", function () { when (self .refs); }); }), from (function (when) { self .on ("updated", function () { when (self .refs); }); }) ])] .map (map (consistentfy)) /*.map (tap (function (how) { log (self .root .localName, "cons refs", how);}))*/ [0];'
								+ '\nvar yield_scope = self .parent;'
								+ '\nwhile (yield_scope && yield_scope ._yield_levels) yield_scope = climb (yield_scope ._yield_levels, yield_scope);'
								//+ '\nlog (self .root .localName, "located father", yield_scope);'
								+ '\nif (yield_scope && yield_scope .yielded_diff) [_refs] .map (map (yield_refs)) .map (diff_refs) .forEach (tap (yield_scope .yielded_diff));'
							: '')
						+ (refs || yield_tag
							? '\nvar self_diff = stream ();'
								+ '\nvar yielded_diff = stream ();'
								+ '\nself .yielded_diff = [yielded_diff]/* .map (tap (function (how) { log (self .root .localName, "recieved", how);}))*/ [0];'
								+ '\nvar diffs = mergeAll ([ self_diff, yielded_diff ]);'
								+ '\nvar ref = function (name) { return ref_diff (name, diffs) };'
								+ '\nvar ref_set = function (name) { return ref_set_diff (name, diffs) };'
								+ (! yield_tag
									? '\nvar _refs = [mergeAll ([ from (function (when) { self .on ("mount", function () { when (self .refs); }); }), from (function (when) { self .on ("updated", function () { when (self .refs); }); }) ])] .map (map (consistentfy)) /*.map (tap (function (how) { log (self .root .localName, "cons refs", how);}))*/ [0];'
									: '')
								+ '\n[_refs] .map (map (self_refs)) .map (diff_refs) .forEach (tap (self_diff));'
							: '')
						+ (scripts .length
							? '\nvar known_as = function (what) { return function (how) { log (self .root .localName, what, how);} };'
								+ '\nself .on ("update", function () {args = self .opts});\n'
							: '')
						+ scripts .join (';\n')
						+ (expressions .length
							? '\nself .expressions = {};\n'
								+ '\n' + expressions .map (function (expression, i) {
									return 'self .expressions [' + i + '] = function (_item) { return ' + expression + ' };';
								}) .join ('\n')
							: '')
						+ (yield_tag
							? '\nif (! self .update_strategy || self .update_strategy === "push") self .shouldUpdate = R .T;'
							: '')
						+ '\nif (typeof self .update_strategy === "function") self .shouldUpdate = self .update_strategy;'
						+ '\n}) (this, this .opts);\n</script>')
					: '') + match;
			})
		})
		/* Inject subcomponents  */
		.map (function (def) {
			return	[def] .concat (R. pipe (R .mapObjIndexed (transform), R .values) (subcomponents))
						.reduce (function (sum, next) { return next + sum; }, ''); 
		})
		/* Inject yield hooks  */
		.map (function (def) {
			return def .replace (/<yield><\/yield>/g, function (match) {
				return '{ enter yield }<yield></yield>{ exit yield }';
			})
		}) [0] + '\n'
}

module .exports = info;
module .exports .parse = transform;
module .exports .compile = compiler .compile;
module .exports .strip_long_strings = function (src, obj_symbol) {
	obj_symbol = obj_symbol || '__tags_strs';
    var esprima = require ('esprima');
	var long_strings =	esprima .tokenize (src, {range: true})
							.filter (function (x) {
								return x .type === 'String' && x .value .length > 1000;
							})
	var as_obj = [long_strings]
		.map (R .map (function (x) {
			return [x .range [0], eval (x .value)]
		}))
		.map (R .fromPairs)
	[0];
	var stripped_src = R .reverse (long_strings) .reduce (function (post_stripped, long_string) {
		return post_stripped .slice (0, long_string .range [0]) + obj_symbol + ' [' + long_string .range [0] + ']' + post_stripped .slice (long_string .range [1]);
	}, src);
	return {
		src: stripped_src,
		strs: `var ${obj_symbol} = ${JSON .stringify (as_obj, null, 4)}`
	};
}
