module .export
= so ((_=_=>
interface =>
temporary_feedback => temporary_categories =>
	so ((_=_=>
	T (design
	) ([ L .modify (marked ('')) (listen (click) (now => temporary_feedback (feedback .back)))
	, L .set (design_categories_list) (S (_ =>
		categories_list_view (just_now (temporary_categories)))) ]),
	where
	, categories_list_view = _categories =>
		so ((
		take
		, _categories_length = _categories .length
		, indexes = Z_ .range (0) (_categories_length) )=>
		T (Z_ .zip (_categories) (indexes)) (Z_ .map ($ ([
			_pair => [Z_ .fst (_pair), Z_ .snd (_pair)], 
			[_category, n_th] => category_view (_category) (n_th) ]))))
	, category_view = so ((_=_=> _category => n_th =>
		T (L .get (design_category) (design)
		) ([ L .set (design_category_title) (_category .title)
		, L .set (design_quizes_list) (quizes_list_view (_category .quizes))
		, translate_y (n_th * category_dy) ]),
	where
	category_dy = ... )=>_)
	, quizes_list_view = _quizes =>
		so ((
		take
		, _quizes_length = _quizes .length
		, indexes = Z_ .range (0) (_quizes_length) )=>
		T (Z_ .zip (_quizes) (indexes)) (Z_ .map ($ ([
			_pair => [Z_ .fst (_pair), Z_ .snd (_pair)], 
			[_quiz, n_th] => quiz_view (_quiz) (n_th) ]))))
	, quizes_view = so ((_=_=> _quiz => n_th =>
		T (L .get (design_quiz) (design)
		) ([ L .set (design_quiz_name) (_quiz .name)
		, L .set (design_quiz_icon) (_quiz .icon)
		, translate_x (n_th * quiz_dx) ]),
	where
	quiz_dx = ... )=>_))=>_),
where
, feedback = data ({
	back: _ => feedback,
	category: category => feedback }))=>_)
