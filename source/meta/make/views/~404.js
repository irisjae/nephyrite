module .exports = (width, height) => auto (_ => {
	var _x_ = Oo (frame_set ('404'), o (svg_scale_info))
	var scale_info = _x_ .scale
	var base_frame = _x_ .svg

	var frame = auto .scale_using (width, height) (scale_info, base_frame)


	return auto .h (frame, {}, {}) })
