/**
 * Created by andre on 4/8/2017.
 */

//Globals
var searchPage = false;
var obj;
var loggedIn = false;
var uid;

document.addEventListener('DOMContentLoaded', function(){
    var trigger = new ScrollTrigger({
        addHeight: true,
        once: true
    });
});
$(document).ready(function(){
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            uid = user.uid;
            loggedIn = true;
        } else {
            $("#account-logout").fadeOut();
            // User is signed out.
            // ...
        }
    });

    $("#account-icon").click(function(){
        if(loggedIn){

        }
        else{
            window.location = 'login.html';
        }
    });

    $("#account-logout").click(function(){
        firebase.auth().signOut().then(function() {
            window.location = 'index.html';
        }).catch(function(error) {
            alert("There was an error signing out.");
        });
    });

    $(".list-keyword").mousedown(function(e){
        console.log(e);
        if( e.button == 0 ){
            $(".list-keyword").removeClass("list-keyword-selected");
            $(this).addClass("list-keyword-selected");
            $('.article-text').removeHighlight();
            $('.article-text').highlight($(this).text());
        }
        if( e.button == 2 ) {
            var val = $(this).text();
            console.log(val);
            // newSearch(val);
        }
    });
    $("#title-container").animate({
        top: "-=150px",
        opacity:1.0
    }, 1000, function() {
        $("#account-icon").fadeIn("slow");
        $("#logo-icon").fadeIn("slow");
        if(loggedIn){
            $("#account-logout").fadeIn();
        }
        $("#search-container").fadeIn("slow");
    });

    $("#search-bar").keydown(function(event){
        if(!searchPage){
            shrinkSearchBar();
            searchPage = true;
        }
        if(event.which=="13")
        {
            search();
        }
    });
});
function scrollUp(){
    $('html, body').animate({
        scrollTop: $("#search-view").offset().top
    }, 500);
}
function scrollDown(){
    $('html, body').animate({
        scrollTop: $("#article-view").offset().top
    }, 500);
}
function enableScrolling(){
    $("#search-view").click(function(e){
        if (e.shiftKey) {
            scrollDown();
        }
    });
    $("#article-view").click(function(e){
        if (e.shiftKey) {
            scrollUp();
        }
    });
}
function setupSecondaryClick(){
    $(".secondary-question").click(function(){
        var searchTerm = $(this).text();
        $("#search-bar").val(searchTerm);
        $(".secondary-container").fadeOut("slow");
        getData(searchTerm);
    })
}
function shrinkSearchBar(){
    $("#search-bar").animate({
        width: "40vw",
        'min-width':"300px",
        padding:"30px"
    }, 1000, function() {
    });
    $("#title-container").fadeOut("medium");
}
function riseSearchBar(){
    $("#search-container").animate({
        top:"30px",
        "margin-top":"0",
        'border-radius':"5px"
    }, 1000, function() {
    });
}
function search(){
    $("#background-design").fadeOut("slow");
    $('html, body').animate({
        scrollTop: $("body").offset().top
    }, 500, function(){
        $("#introduction-view").hide();
        $('body').animate({
            height: "100vh"
        }, 500, function(){
            $(".cssload-thecube").fadeIn();
            var quill = new Quill('#notes-panel', {
                theme: 'bubble'
            });

            $("#loading-view").fadeOut("medium", function(){
                $("#article-view").fadeIn();
                clickArticle();
            });
        });
    });
    riseSearchBar();
    console.log("Searching...");
    var searchTerm = $("#search-bar").val();
    //getData(searchTerm);
}
function clickArticle(){
    $(".article").click(function(e){
        $(".article").removeClass("article-selected");
        $(this).addClass("article-selected");
        $("#article-list-container").animate({
            width:"20vw",
            "min-width":"200px"
        },500, function(){
            $("#article-tab").fadeIn();
        });
    });
}
function getData(term){
    enableScrolling();
    startLoading();
    $.ajax({
        type: "POST",
        url: "/search",
        data: {question:term},
        success: function(result){
            obj = result;
            console.log(obj);
            resetInfo();
            stopLoading();
            appendArticleList(obj);
            displayArticleView();
            notepadMemory();
        },
        error:function(error){
            console.log(error);
            alert("Error! Please reload!");
        }
    });
}
function resetInfo(){
    $("#article").empty();
    $(".article-content").empty();
    $("#bibliography").empty();
    $("#keyword-list").empty();

}
function appendSecondary(index){
    for(var i=0;i<obj[index].concepts.length;i++)
    {
        $("<h2/>", {
            html: obj[index].concepts[i],
            class:"secondary-question click"
        }).appendTo(".secondary-container");
    }
    setupSecondaryClick();
}
function appendKeywords(index){
    var list = "";
    if(obj[index].keywords !=null) {
        for (i = 0; i < obj[index].keywords.length; i++) {
            list += "<h4 class=\"list-keyword click\" >" + obj[index].keywords[i] + "<\/h4>";
        }
    }
    $(list).appendTo("#keyword-list");
    setupKeywordClick();
}
function appendArticleList(){
    var list = "";
    for(i=0;i<obj.length;i++){
        list+="<div class=\"article click\" onclick=\"openArticle("+i+")\"><h3 class=\"article-list-elements article-name\">" + obj[i].title + "<\/h3>";
        if(obj[i].summary!=null)
            list+="<h4 class=\"article-list-elements article-desc\">" + obj[i].summary + "<\/h4>";
        list+="<div class=\"article-list-elements article-keywords\">";
        if(obj[i].keywords != null && obj[i].keywords.length>1)
        {
            for(a = 0; a<2;a++){
                list+="<h4 class=\"mini-keyword click\">"+obj[i].keywords[a]+"</h4>";
            }
        }
        var percen = parseInt(Math.abs( (obj[i].sentiment)*100));
        console.log(percen);
        if(percen < 1){
            list+="<\/div><div class=\"reliability\" id =\"A"+percen+"\">Can't Determine Reliability";
        }
        else {
            list += "<\/div><div class=\"reliability\" id =\"A" + percen + "\">Bias: ";
        }

        list+="</div></div>";

    }
    $(list).appendTo("#article-list-container");
    $("<div class='main-container'><div class='main-content'><h3 class=\"intro\">click on an article to proceed<\/h3></div></div>").appendTo(".article-content");

    for(c = 0; c<obj.length;c++){
        var percen = parseInt(Math.abs((obj[c].sentiment)*100));
        var bar = new ProgressBar.Line("#A"+percen, {
            strokeWidth: 4,
            easing: 'easeInOut',
            duration: 1400,
            color: '#ffca82',
            fill: 'rgba(255, 255, 255, 0.1)',
            trailColor: '#eee',
            trailWidth: 1,
            svgStyle: {width: (percen/2)+"%", height: '100%'}
        });

        bar.animate(1.0);
    }
}
function displayArticleView(){
    $(".article-view").fadeIn("slow");
    $(".secondary-container").fadeIn("slow");
}
function appendBiblio(index){
    $("<h4 class=\"citation\">"+obj[index].bibliography+"<\/h4>").appendTo("#bibliography");
}
function notepadMemory(){
    array=[];
    for(var i=0; i<obj.length;i++)
    {
        array.push("");
    }
}
function updateNotepad(index){
    if(isOverflowed($("#pad")))
    {
        $("#pad").css({
            overflow: 'auto'
        });
    }
    console.log(array);
    $("#pad").val(array[index]);
}
function storeNotes(index){
    array[index]= $("#pad").val();   
}
function initNotes(index){
    $("#pad").off();
    $("#pad").keyup(function(){
        storeNotes(index);
    })
}

function openArticle(index){
    $(".article-content").empty();
    $("#keyword-list").empty();
    $(".secondary-container").empty();
    $("#bibliography").empty();
    initNotes(index);

    var list = "";
    list+="<h2 class=\"article-list-elements article-title article-heading\">"+obj[index].title+"<\/h2>";
    list+="<h2 class=\"article-list-elements article-author article-heading\">";
    if (obj[index].authors != null){
        for(i=0;i<obj[index].authors.length;i++){
            if(i>3){
                list+=" et al...";
                break;
            }
            list+=obj[index].authors[i]+", ";
        }
        list = list.substring(0, list.length - 2);
    }
    list+="<\/h2>"+obj[index].abstract;
    // list+="<div>"
    $(list).appendTo($(".article-content"));

    appendKeywords(index);
    appendSecondary(index);
    appendBiblio(index);
    updateNotepad(index);
}
function isOverflowed(element){
    return element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth;
}
function changeToKeywords(){
    $(".toolbar").hide();
    $("#keywords").fadeIn();
}
function changeToBibliography(){
    $(".toolbar").hide();
    $("#bibliography").fadeIn();
}
function changeToNotes(){
    $(".toolbar").hide();
    $("#notes").fadeIn();
}