/**
 * Created by andre on 4/8/2017.
 */

//Globals
var searchPage = false;
var obj;
var loggedIn = false;
var uid;
var idTracker = 0;
var highlightedSpan = null;

$(document).ready(function(){
    $("#logo-icon").click(function(){
        window.location = 'index.html';
    });
    initialAnimation();
    firebaseChange();
    setupScrollTrigger();
    setupAccountButtons();
	setupReturnHome();
    setupKeywordSearch();
    setupSearchBar();
    setupHighlight();
});
function initialAnimation(){
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
        $("#project-container").fadeIn("slow");
    });
}
function firebaseChange(){
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            uid = user.uid;
            loggedIn = true;
        } else {
            $("#account-logout").fadeOut();
        }
    });
}
function setupAccountButtons(){
    $("#logo-icon").click(function(){
        window.location = 'index.html';
    });
    $("#account-icon").click(function(){
        if(loggedIn){
            window.location = 'profile.html';
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
}
function setupReturnHome(){
	$("#logo-icon").click(function(){
		window.location="index.html";
	});
}
function setupKeywordSearch(){
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
}
function setupSearchBar(){
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
}
function setupHighlight(){
    function getSelectedSpanIds() {
        var sel = rangy.getSelection(), ids = [];
        for (var r = 0; r < sel.rangeCount; ++r) {
            var spans = sel.getRangeAt(r).getNodes([1], function(node) {
                return node.nodeName.toLowerCase() == "span";
            });
            for (var i = 0, len = spans.length; i < len; ++i) {
                ids.push(spans[i].id);
            }
        }
        return ids;
    }

    function removespan(span) {
        var span_contents = span.innerHTML;
        var span_parent = span.parentNode;
        var text_node = document.createTextNode(span.innerHTML);
        span_parent.replaceChild(text_node, span);
    }

    $(document).on('click','.highlight',function(e){
        var selection = window.getSelection().toString();
        $('#selTxt').val(selection.toString());
        var x = e.pageX;
        var y = e.pageY;
        placeTooltip(x, y);
        highlightedSpan = this;
        $("#tooltipDel").show();
    });

    var t = '';
    function gText(e) {
        t = (document.all) ? document.selection.createRange().text : document.getSelection();
    }
    $("#tooltipH").hide();
    $("#tooltipHandD").hide();
    $("#tooltipDel").hide();

    document.onmouseup = gText;

    $('#article').mouseup(function(e) {
        console.log(t.toString().trim().split(" ").length);
        console.log(t.toString().trim().split(" "));
        if(t.toString().trim().split(" ").length== 1 && t.toString().trim() != "") {
            var selection = window.getSelection().toString();
            $('#selTxt').val(selection.toString());
            var x = e.pageX;
            var y = e.pageY;
            placeTooltip(x, y);
            $("#tooltipHandD").show();
        }
        else if(t.toString().trim().split(" ").length > 1) {
            var selection = window.getSelection().toString();
            $('#selTxt').val(selection.toString());
            var x = e.pageX;
            var y = e.pageY;
            placeTooltip(x, y);
            $("#tooltipH").show();
        }
        else {
            $("#tooltipH").hide();
            $("#tooltipHandD").hide();
            $("#tooltipDel").hide();
        }
    });

    function placeTooltip(x_pos, y_pos) {
        $("#tooltipHandD, #tooltipH, #tooltipDel").css({
            top: (y_pos + 10) + 'px',
            left: x_pos + 'px',
            position: 'absolute'
        });
    }

    $("#high,#high2").click(function() {
        var ids = getSelectedSpanIds();
        for(var i =0; i<ids.length; i++) {
            removespan(document.getElementById(ids[i]));
        }
        var range = window.getSelection().getRangeAt(0),
            span = document.createElement('span');

        span.className = 'highlight';
        span.id = 'id'+idTracker.toString();
        idTracker += 1;
        span.appendChild(range.extractContents());
        range.insertNode(span);
    });

    $("#unHigh").click(function() {
        removespan(highlightedSpan);
        $("#tooltipDel").hide();
    });

    var modal = document.getElementById('myModal');
    var span = document.getElementsByClassName("close")[0];

    $("#def").click(function() {
        var div = document.getElementById("dictionary-modal");
        div.innerHTML = '<h1 style="font-size: 2vw;">'+t.toString().charAt(0).toUpperCase()+t.toString().substring(1,t.toString().length)+'</h><p style="font-size: 1.2vw; margin-top: 2vh;">Add stuff from dictionary API here</p>';
        modal.style.display = "block";
    });
    span.onclick = function() {
        modal.style.display = "none";
    };
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    };
}

function shrinkSearchBar(){
    $("#search-bar").animate({
        width: "40vw",
        'min-width':"300px",
        padding:"30px"
    }, 1000, function() {
    });
    $("#project-container").fadeOut("fast");
    $("#title-container").fadeOut("fast");
}
function riseSearchBar(){
    $("#search-container").animate({
        top:"30px",
        "margin-top":"0",
        'border-radius':"5px"
    }, 1000);
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
