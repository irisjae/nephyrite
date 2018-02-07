+ function () {
    var ui_info = pre (function () {
        return {
            dom: h (frame ('404'), {}, {})
        }
    });
    
    window .uis = R .assoc (
        '404', function (_) {
            var dom = ui_info .dom .cloneNode (true);
            
            return {
                dom: dom
            };
        }) (window .uis);
} ();
