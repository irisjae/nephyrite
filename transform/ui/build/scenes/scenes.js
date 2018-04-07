var Map = require ('JS/Map')

var Oo = require ('o-o-o-o-o') .Oo
var o = require ('o-o-o-o-o') .o
var oO = require ('o-o-o-o-o') .oO
var R = require ('ramda')

var thiss = require ('thiss')

var recast = require ('recast')
var auto = require ('./auto')
var happy_eval = require ('./debuggable_eval')


var call_auto = node =>
	node .type === 'CallExpression' && node .callee .name === 'auto'

var call_auto_ = x =>
	node =>
		node .type === 'CallExpression' && node .callee .type === 'MemberExpression'
		&& node .callee .object .name === 'auto' && node .callee .property .name === x

var auto_require = node =>
	node .type === 'VariableDeclaration' && node .declarations .length === 1
	&& node .declarations [0] .id .name === 'auto'
	&& node .declarations [0] .init .type === 'CallExpression' && node .declarations [0] .init .callee .name === 'require'
	&& node .declarations [0] .init .arguments .length === 1 && node .declarations [0] .init .arguments [0] .type === 'Literal'
	&& node .declarations [0] .init .arguments [0] .value === '__auto'











//make sure that the expressions selected by selectors are pure
var precomputation = selectors => x =>
	Oo (x, R .tap (replace_on_ (precomputed_substition (selectors))))
var replace_on_ = substitutions =>
	ast => {
		; recast .visit (ast, {
			visitExpression: path => {
				var node = path .node

				var replacement = substitutions .get (node)

				if (replacement !== undefined) {
					; path .replace (replacement)
				}

				this .traverse (path)
			}
		})
	}
//selectors should be for paramtered-combinators; faux-closures
var precomputed_substition = selectors =>
	ast => {
		var expressions = []
		var expression_id = node => {
			var id = expressions .length
			; expressions .push (node)
			return id
		}

		var sampling_expression = node => {
			; var id = expression_id (node)

			return Oo (node,
				o (x => recast .print (x) .code),
				o (x => `(____samples [${JSON .stringify (id)}] = ${x})`),
				o (x => recast .parse (x) .program))
		}
		var enforce_complete_sampling = () => 
			Oo (expressions,
				o (R .toPairs),
				o (R .map (x => {
					var id = x [0]
					var node = x [1]

					var id_code = JSON .stringify (id)
					var node_code = recast .print (node) .code

					return `if (${id_code} in ____samples) {____samples [${id_code}] = ${node_code}}`
				})),
				o (R .join (';')),
				o (x => recast .parse (x) .program),
				o (x => x .body))
		var sampling_code_wrapper = sampling_code =>
			`((____samples) => { ${sampling_code} ; return ____samples }) ({})`

		var recombine_samples = expressions => samples =>
			Oo (new Map (), o (R .tap (x => {
				; Oo (R .keys (expressions), o (R .forEach (y => {
					; x .set (expressions [y], samples [y])
				})))
			})))

		
		; var samples = Oo (ast,
			o (x => Oo (x,
				o (R .tap (ast => {
					; recast .visit (ast, {
						visitExpression : thiss (self => path => {
							var node = path .node

							if (Oo (selectors,
								o (R .any (x => x (node))))) {
								; path .replace (sampling_expression (node))
							}

							self .traverse (path)
						})
					})
					; Oo (enforce_complete_sampling (),
						oO (R .forEach (x => {
							; ast .body .push (x)
						})))
				})),
				o (x => recast .print (x) .code)),
				o (sampling_code_wrapper)),
			o (x => Oo (x,
				o (x => happy_eval (x, ast .loc .lines .name)),
				o (R .map (x => Oo (x,
					o (x => `(${auto .js_dehydration .dehydrate (x)})`),
					o (x => recast .parse (x) .program),
					o (x => R .head (x .body))))))))

		return recombine_samples (expressions) (samples)
	}


module .exports = (filename, src) => 
	Oo (src,
		o (x => recast .parse (x, { sourceFileName: filename }) .program),
		o (precomputation ([
			auto_require,
			call_auto_ ('scale_using'),
			call_auto_ ('h'),
			call_auto
		])),
		o (x => recast .print (x) .code))
	//return assets, rehydrators from require ('./hydration')

