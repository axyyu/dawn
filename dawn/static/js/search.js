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
    if (sb.style.right == "-400px") {
        sb.style.right = "0";
        nav.style.width = "400px";
        tb.innerHTML = '<span class="fa fa-caret-right"></span>';
    } else {
        sb.style.right = "-400px";
        nav.style.width = "14px";
        tb.innerHTML = '<span class="fa fa-caret-left"></span>';
    }
}
