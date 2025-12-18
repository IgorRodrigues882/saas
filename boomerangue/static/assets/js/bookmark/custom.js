


// list-view
$(".grid-bookmark-view").on("click", function (e) {
  $(".details-bookmark").removeClass("list-bookmark");
});
$(".list-layout-view").on("click", function (e) {
  $(".details-bookmark").css("opacity", "0.2");
  $(".details-bookmark").addClass("list-bookmark");
  setTimeout(function () {
    $(".details-bookmark").css("opacity", "1");
  }, 500);
});
