"use strict";
function testAnim(x) {
    $('.modal .modal-dialog').attr('class', 'modal-dialog modal-lg ' + x + '  animated');
};
var modal_animate_custom = {
    init: function() {
        $('#modalRelatorioVendas').on('show.bs.modal', function (e) {
            var anim = 'flash';
            testAnim(anim);
        })
        $('#modalRelatorioVendas').on('hide.bs.modal', function (e) {
            var anim = 'flash';
            testAnim(anim);
        })
        
    }
};
(function($) {
    "use strict";
    modal_animate_custom.init()
})(jQuery);