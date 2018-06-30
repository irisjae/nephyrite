//give me the string for an actual expression, not statements
module .exports = (src, file_name) => {
	if (! file_name) {
		file_name = 'temp-' + new Date () .toISOString ()
	}
	else if (file_name .startsWith (config .paths .scenes .src)) {
		file_name = file_name .slice (config .paths .scenes .src .length)
	}

	var proper_name = Oo (file_name, o (R .split ('.')), o (x => !! (x .length > 1) ? R .init (x) : x), o (R .join ('.')))
	var eval_path = path .join (automate_cache, proper_name + '.js')

	;; prepare (eval_path)
	;; write (eval_path) (`module .exports = (${src})`)

	return require (eval_path) (auto)
}
