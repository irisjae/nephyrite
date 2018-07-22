var { T, R } = require ('ex-jay-esque')

var window = require ('__window')
var Promise = require ('bludbird')
var console = require ('__console')





/*
Errors
*/
;window .addEventListener ('unhandledrejection', e => {{
	;e .preventDefault ()
	
	;console .error (e) }})
;window .onerror = (message, source, lineno, colno, error) => {{
	;console .error (message, source, lineno, colno, error)
}}

/*
Use app
*/
;T (promise_of (x => {{
	;document .addEventListener (
		!! (window .cordova !== 'undefined')
		? 'deviceready'
		: 'DOMContentLoaded', x) }})) (then (_ => {{
	;window .ui_ = window .uis .$ () }}))
