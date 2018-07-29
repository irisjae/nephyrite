module .exports
= so ((_=_=>

$ ([ L .remove (query ('#examples'))
, L .modify (query ('#scrolls')) (attach_scroll)
, L .modify (query ('#back')) (mark ('back'))
, L .modify (query ('categories-list-somehow'))
	($ ([ mark_hole ('categories-list')
	, L. modify (L .elems)
		($ ([ mark ('category')
		, L .modify (query ('category-title')) (mark_hole ('category-title'))
		, L .modify (query ('quizes-list-somehow'))
			($ ([ mark_hole ('quizes-list')
			, L .modify (L .elems)
				($ ([ mark ('quiz')
				, L .modify (query ('name')) (mark_hole ('quiz-name'))
				, L .modify (query ('img')) (mark_hole ('quiz-img')) ])) ])) ])) ]))
, design_interface ]

)=>_)
