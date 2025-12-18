

// second demo of simple mde
var sample = [
    
]
var simplemde = new SimpleMDE({element: $("#smde")[0], toolbar: ["bold", "italic", "heading", "|", "quote", "unordered-list", "ordered-list", "|", "link", "image", "|", "guide"], scrollingContainer: document.querySelector(".CodeMirror"), spellChecker: false});


$(document).ready(function() {
    writeSample();
    simplemde.codemirror.on("change", function(){
        var renderedHTML = simplemde.options.previewRender(simplemde.value());
        $("#write_here").html(renderedHTML);
        $("#write_here").css("height", $(".row").height() +  "px" );
    });
});
function writeSample() {
    var s = "";
    s = getSample();
    simplemde.value(s);
    var renderedHTML = simplemde.options.previewRender(simplemde.value());
    $("#write_here").html(renderedHTML);
    $("#write_here").css("height", $(".row").height() +  "px" );
}
function getSample() {
    var s = "";
    $.each(sample, function( index, value ) {
        //alert( index + ": " + value );
        s = s + value + "\n\r";
    });
    return s;
}


// simple mde-2

var sample2 = [
    
]
var simplemdeIA = new SimpleMDE({element: $("#mde_ia")[0], toolbar: ["bold", "italic", "heading", "|", "quote", "unordered-list", "ordered-list", "|", "link", "|", "guide"],spellChecker: false});
$(document).ready(function() {
    writeSample();
    simplemdeIA.codemirror.on("change", function(){
        var renderedHTML = simplemdeIA.options.previewRender(simplemdeIA.value());
        $("#write_here").html(renderedHTML);
        $("#write_here").css("height", $(".row").height() +  "px" );
    });
});
function writeSample() {
    var s = "";
    s = getSample();
    simplemdeIA.value(s);
    var renderedHTML = simplemdeIA.options.previewRender(simplemdeIA.value());
    $("#write_here").html(renderedHTML);
    $("#write_here").css("height", $(".row").height() +  "px" );
}
function getSample() {
    var s = "";
    $.each(sample2, function( index, value ) {
        //alert( index + ": " + value );
        s = s + value + "\n\r";
    });
    return s;
}