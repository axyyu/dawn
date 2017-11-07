/*var sidebar = false;

$(document).ready(function(){
    
});
function toggleSidebar(){
    if(sidebar){
        console.log("Extend");
        sidebar = false;
        $("#search-content").css("grid-template-columns", "auto 2vw 20px 300px");
        $("#search-info").show();
        $("#search-click").empty();
        $("#search-click").html('<span class="fa fa-caret-right"></span>');
    }
    else{
        console.log("Hide");
        sidebar = true;
        $("#search-content").css("grid-template-columns", "auto 2vw 20px 0");
        $("#search-info").hide();
        $("#search-click").empty();
        $("#search-click").html('<span class="fa fa-caret-left"></span>');
    }
}*/
var tb = document.querySelector("#search-click"),
    sb = document.querySelector("#search-info"),
	sc = document.querySelector("#search-content"),
    nav = document.querySelector("nav#search-sidebar");
    //tb = document.querySelector("#banner h1"),

tb.addEventListener("click", function () {
    toggleSidebar()
}, false);
tb.addEventListener("touchleave", function () {
    toggleSidebar()
}, false);


function toggleSidebar(toggleOpenAllowed) {
    if (sb.style.right == "-300px") {
        sb.style.right = "0";
        nav.style.width = "300px";
        tb.innerHTML = '<span class="fa fa-caret-right"></span>';
    } else {
        sb.style.right = "-300px";
        nav.style.width = "12px";
        tb.innerHTML = '<span class="fa fa-caret-left"></span>';
    }
}
