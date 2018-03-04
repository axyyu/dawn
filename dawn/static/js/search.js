/*
Sidebar
*/
var tb = document.querySelector("#search-click"),
    sb = document.querySelector("#search-info"),
	sc = document.querySelector("#search-content"),
    nav = document.querySelector("nav#search-sidebar");

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
        nav.style.width = "16px";
        tb.innerHTML = '<span class="fa fa-caret-left"></span>';
    }
}

/*
Citation
*/
var bibmodal = document.getElementById('bib-modal');
var bibclose = document.getElementById("bib-close");
function cite(mla, apa, chicago){
    console.log(mla);
    console.log(apa);
    console.log(chicago);

    var pmla = document.getElementById('mla');
    var papa = document.getElementById('apa');
    var pchicago = document.getElementById('chicago');

    pmla.innerHTML = mla;
    papa.innerHTML = apa;
    pchicago.innerHTML = chicago;

    bibmodal.style.display = "block";
}
bibclose.onclick = function() {
    bibmodal.style.display = "none";
}
window.onclick = function(event) {
    if (event.target == bibmodal) {
        bibmodal.style.display = "none";
    }
}

