var auto = require ('__auto')

var ui_info = {
	dom : (width, height) => auto (() => {
		var _x_ = Oo (frame_set ('404'), o (svg_scale_info))
		var scale_info = _x_ .scale
		var base_frame = _x_ .svg

		var frame = auto .scale_using (width, height) (scale_info, base_frame)


		return auto .h (frame, {}, {})
	})
}

module .exports = x => {
	var dom = ui_info .dom .cloneNode (true);
	
	return {
		dom: dom
	}
}
