$(document).ready(function(){
    clickProject();
    clickArticle();
});
function clickProject(){
    $(".project").click(function(e){
        $(".project").removeClass("project-selected");
        $(this).addClass("project-selected");
        $("#project-list-container").animate({
            width:"15vw",
            "min-width":"200px"
        },500, function(){
            $("#project-tab").fadeIn();
        });
    });
}

function clickArticle(){
    $(".article").click(function(e){
        $("#article-list-container").hide();
        $("#article-container").fadeIn();
    });
}

function exportBibliography(){

}
function exportNotes() {

}
function saveSettings() {

}