var R = require ('ramda');
var scss = require ('node-sass');
var css = require ('css');
var path = require ('path');
var fs = require ('fs-extra');

var time = require ('./_util') .time
var md5 = require ('./_util') .md5
var file = require ('./_util') .file
var write = require ('./_util') .write






var styles_cache = require ('./_config') .paths .styles .cache;
var styles_copy = require ('./_config') .paths .styles .copy;







scss .compile =	function (metastyles) {
					return	(scss .renderSync ({
								data: metastyles || '/**/'/*,
								omitSourceMapUrl: true,
								sourceMap: false,
								sourceMapContents: false,
								sourceMapEmbed: false,
								sourceMapRoot: false*/
							})) .css .toString ();
				};
var stringify =	function (node_array) {
					return	css .stringify ({
								type: 'stylesheet',
								stylesheet:	{
												rules: node_array,
												parsingErrors: []
											}
							});
				};
var union =	function (styles_set) {
				/*if (styles_set .length === 1)
					return styles_set [0];*/
	
				var NodeSet = require ('css-semdiff/dist/css_utils') .NodeSet;
				var uniformNode = require ('css-semdiff/dist/css_utils') .uniformNode;
				var flatMap = require ('css-semdiff/dist/collection_utils') .flatMap;
				
				return	stringify (
							styles_set .map (function (styles) {
								var rules = css .parse (styles) .stylesheet .rules;
								var uniformed_nodes = flatMap (rules, uniformNode);
								return new NodeSet (uniformed_nodes);
							}) .reduce (function (union_set, node_set) {
								for (var node of node_set .nodes) {
									union_set .add (node);
								}
								return union_set;
							}) .toArray ()
						);
			};
var extend =	function (base_styles, metastyles) {
					return scss .compile (base_styles + metastyles);
				};

var grow_nodes =	function (baby_nodes, grown_nodes) {
						grown_nodes = grown_nodes || [];
						
						if (! baby_nodes .length)
							return grown_nodes;
							
						var ready = baby_nodes .filter (function (node) {
										return node .dependencies .every (function (_) {
											for (var i in grown_nodes) {
												if (grown_nodes [i] .names .indexOf (_) !== -1)
													return true;
											}
											return false;
										});
									})
							
						var freshly_grown = [ready]
							.map (R .groupBy (function (node) {
								return node .dependencies .join ('+')
							}))
							.map (R .mapObjIndexed (function (nodes, dependency_names) {
								var dir_path = dependency_names ? path .join (styles_cache, md5 (dependency_names)) : path .join (styles_cache, 'free');
							
								var dependencies =	(dependency_names ? dependency_names .split ('+') : [])
														.map (function (name) {
															for (var i in grown_nodes) {
																if (grown_nodes [i] .names .indexOf (name) !== -1)
																	return grown_nodes [i];
															}
															throw name + ' not found'
														});
														
								var dependency_styles = dependencies
															.map (function (node) { return node .styles })
															.reduce (function (sum, next) { return sum + next; }, '');
								var dependency_path = path .join (dir_path, 'dependency.css');
								dependency_styles =	time ((
                    								    dependencies .length
                    								    ? 'cached dependency group ' + dependencies .map (function (node) {
    														return node .names [0]
    													}) .join (' + ')
    													: 'cached free group'
								                    ), () =>
														cache_at (dependency_path .slice (styles_cache .length + 1),
															dependency_styles,
															() => union ([dependency_styles])
														)
													);
								var dependencies_json = JSON .stringify (dependencies .map (function (node) {
									var node_ = {};
									for (var i in node) {
										node_ [i] = node [i]
									}
									delete node_ .styles;
									delete node_ .metastyles;
									return node_
								}), null, 4); 
								cache_at (path .join (dir_path, 'dependencies.json') .slice (styles_cache .length + 1),
									dependencies_json,
									() => dependencies_json
								)
							
								return	nodes .map (function (node) {
											var path_ = path .join (dir_path, node .path);
											var metastyles = node .metastyles;
											
											var node_ = {};
											for (var i in node) {
												node_ [i] = node [i];
											}
											node_ .styles =	time ('cached extension ' + node .path, () =>
																cache_at (path_ .slice (styles_cache .length + 1), dependency_styles + node .metastyles, () =>
																	extend (dependency_styles, metastyles)));
											return node_;
										})
							}))
						[0]
						
						var freshly_grown_list =	R .values (freshly_grown)
														.reduce (function (sum, next) { return sum .concat (next); }, [])
						var new_grown_nodes = grown_nodes .concat (freshly_grown_list);
						var new_baby_nodes =	baby_nodes .filter (function (node) {
													for (var i in freshly_grown_list) {
														if (freshly_grown_list [i] .path == node .path)
															return false;
													}
													return true;
												})
												
						if (grown_nodes .length === new_grown_nodes .length) {
							var massacre =	function (node) {
												var node_ = {};
												for (var i in node) {
													node_ [i] = node [i]
												}
												node_ .styles = node .styles ? true : false;
												node_ .metastyles = node .metastyles ? true : false;
												return node_;
											}
							throw new Error (
								JSON .stringify (
									['cyclic dependency?', baby_nodes .map (massacre), grown_nodes .map (massacre)], null, 4)
							);
						}
						
						return grow_nodes (new_baby_nodes, new_grown_nodes);
					};
				
var cache_at =	function (name, copy_source, cache_source) {
					var copy_path = path .join (styles_copy, name) .replace (/\.css$|\.scss$/, '.cache-invalidated')
					var cache_path = path .join (styles_cache, name) .replace (/\.css$|\.scss$/, '.cache-invalidated')
					if (fs .existsSync (copy_path) && file (copy_path) === copy_source) {
						var cache = file (cache_path)
						
						var new_copy_path = copy_path .replace (/\.cache-invalidated$/, '.cache-refreshed')
						var new_cache_path = cache_path .replace (/\.cache-invalidated$/, '.cache-refreshed')
						fs .renameSync (copy_path, new_copy_path)
						fs .renameSync (cache_path, new_cache_path)
						
						return cache;
					}
					else {
						var cache = cache_source ();
						
						var new_copy_path = path .join (styles_copy, name) .replace (/\.css$|\.scss$/, '.cache-refreshed')
						var new_cache_path = path .join (styles_cache, name) .replace (/\.css$|\.scss$/, '.cache-refreshed')
						write (new_copy_path) (copy_source);
						write (new_cache_path) (cache);
						
						return cache;
					}
				};
var invalidate =	function (dir) {
						fs .readdirSync (dir) .forEach (function (file) {
							const file_path = path .resolve (dir, file);
							const file_info = fs .statSync (file_path);
							
							if (file_info .isDirectory ()) {
								invalidate (file_path)
							}
							else {
								if (file_path .endsWith ('.cache')) {
									fs .renameSync (file_path, file_path .replace (/\.cache$/, '.cache-invalidated'))
								}
							}
						})
					};
var refresh =	function (dir) {
					fs .readdirSync (dir) .forEach (function (file) {
						const file_path = path .resolve (dir, file);
						const file_info = fs .statSync (file_path);
						
						if (file_info .isDirectory ()) {
							refresh (file_path)
						}
						else {
							if (file_path .endsWith ('.cache') || file_path .endsWith ('.cache-invalidated')) {
								fs .unlinkSync (file_path)
							}
							if (file_path .endsWith ('.cache-refreshed')) {
								fs .renameSync (file_path, file_path .replace (/\.cache-refreshed$/, '.cache'))
							}
						}
					})
				};
				
var invalidate_cache =	function () {
							fs .ensureDirSync (styles_copy)
							fs .ensureDirSync (styles_cache)
							
							invalidate (styles_cache)
							invalidate (styles_copy)
						}
var refresh_cache =	function () {
						refresh (styles_cache)
						refresh (styles_copy)
					};







var resolve_dependencies = function (nodes) {
	return	nodes .map (function (build_node) {
				var dependencies = [];
				
				return [build_node]
				    .map (R .assoc ('metastyles', build_node .metastyles .replace (/@require ([^;]+);/g, function (match, dependency) {
						dependencies .push (dependency);
						return '';
					})))
				    .map (R .assoc ('dependencies', dependencies))
			    [0];
			})
			.concat ({
				names: [],
				path: '*',
				dependencies: nodes .map (function (node) {
					return node .names [0];
				}),
				metastyles: ''
			})
};



module .exports = {
	weave: resolve_dependencies,
	invalidate: invalidate_cache,
	grow: grow_nodes,
	clean: refresh_cache
}
