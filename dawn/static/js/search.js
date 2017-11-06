var sidebar = false;

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
}