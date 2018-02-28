+ function () {

	var ui_info = {
		dom: (width, height) => pre (function () {
			return (_ => h (_ .frame, {}, {}))
				((_ => ({
					frame: scale_using (width, height) (_ .scale_info, _ .base_frame)
				}))
					(Oo (frame_set ('404'), o (svg_scale_info), o (x => ({
						scale_info: x .scale,
						base_frame: x .svg
					})))))
				
		})
	};
	
	window .uis = R .assoc (
		'404', function (_) {
			var dom = ui_info .dom .cloneNode (true);
			
			return {
				dom: dom
			};
		}) (window .uis);
} ();
