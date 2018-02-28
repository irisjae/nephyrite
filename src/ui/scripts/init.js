var Oo = require ('o-o-o-o-o') .Oo;
var o = require ('o-o-o-o-o') .o;
var oO = require ('o-o-o-o-o') .oO;
var R = require ('ramda');

var window = require ('__/modules/window');
var Promise = require ('bludbird');



var then = R .invoker (1, 'then');


/*
Errors
*/
window .addEventListener ('unhandledrejection', function (e) {
	e .preventDefault ();
	
	console .error (e);
});
window .onerror = function (message, source, lineno, colno, error) {
	console .error (message, source, lineno, colno, error);
};

/*
Use app
*/
Oo (promise_of (x => {
		if (window .cordova !== 'undefined')
			document .addEventListener ('deviceready', x);
		else
			document .addEventListener ('DOMContentLoaded', x);
	}),
	oO (then (function () {
		window .ui_ = window .uis .$ ();
	}))
)
