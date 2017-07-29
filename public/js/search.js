/**
 * Created by andre on 4/8/2017.
 */

//Globals
var searchPage = false;
var obj;
var loggedIn = false;
var searching = false;

var uid;
var projectid;
var userlocation;

var idTracker = 0;
var highlightedSpan = null;

$(document).ready(function(){
    firebaseChange();
    setupIconButtons();
    setupSearchBar();
});
function firebaseChange(){
    firebase.auth().onAuthStateChanged(function(user) {
        if(searchPage){
            window.location='index.html';
        }
        if (user) {
            uid = user.uid;
            loggedIn = true;
            userlocation = 'users/' + uid +'/';

            var accountIcon = $("#account-icon");
            var accountLogout = $("#account-logout");

            accountIcon.attr("title","Profile");
            accountIcon.unbind( "click" );
            accountIcon.click(function() {
                window.location = 'profile.html';
            });

            accountLogout.unbind( "click" );
            accountLogout.click(function(){
                firebase.auth().signOut().then(function() {
                    window.location = 'index.html';
                }).catch(function(error) {
                    alert("There was an error signing out.");
                });
            });
            accountLogout.show();

            setupProjectList();
        } else {
            userlocation = null;
            uid=null;
            projectid=null;

            var accountIcon = $("#account-icon");
            accountIcon.attr("title","Log In");
            accountIcon.unbind( "click" );
            accountIcon.click(function() {
                window.location = 'login.html';
            });
            $("#account-logout").fadeOut("fast");
        }
    });
}
function setupIconButtons(){
    var logoicon = $( "#logo-icon");
    logoicon.unbind( "click" );
    logoicon.click(function(){
        window.location = 'index.html';
    });
    $(".popup-close").click(function () {
        $("#popup-view").hide();
    });
}
function setupSearchBar(){
    $("#search-bar").keydown(function(event){
        if(!searchPage){
            $("#title-container").fadeOut("fast");
            searchPage = true;
        }
        if(event.which=="13")
        {
            search();
        }
    });
}
function setupProjectList(){
    var location = firebase.database().ref(userlocation);
    location.once('value').then(function(snapshot) {
        $.each(snapshot.val(), function(k, v) {
            var project = "<h3 class='project-list-element click' onclick='selectProject(\""+ k +"\", this)'>"+v.name+"</h3>";
            $(project).appendTo(".project-list");
        });
    });
    $( "#project-container").show();
}
function selectProject(projectkey, element){
    if(projectkey=="live"){
        projectid = null;
        var k = $(".selected-project").attr("id");
        var v = $(".selected-project").text();
        var project = "<h3 class='project-list-element click' onclick='selectProject(\""+ k +"\", this)'>"+v+"</h3>";
        $(".selected-project").text("Live Project");
        $(".selected-project").attr('id',projectkey);
        $(project).appendTo(".project-list");
    }
    else{
        var k = $(".selected-project").attr("id");
        var v = $(".selected-project").text();
        projectid = projectkey;
        var project = "<h3 class='project-list-element click' onclick='selectProject(\""+ k +"\", this)'>"+v+"</h3>";
        var location = firebase.database().ref(userlocation + projectkey);
        location.once('value').then(function(snapshot) {
            $(".selected-project").text(snapshot.val().name);
            $(".selected-project").attr('id',projectkey);
        });
        $(project).appendTo(".project-list");
    }
    $(element).remove();
}

function search(){
    $("#search-container").animate({
        top:"30px",
        "margin-top":"0",
        'border-radius':"5px"
    }, 1000);
    $("#background-design").fadeOut("fast");
    $('html, body').animate({
        scrollTop: $("body").offset().top
    }, 500, function(){
        $("#introduction-view").hide();
        $(".cssload-thecube").fadeIn("fast", function(){
            var searchTerm = $("#search-bar").val();
            getData(searchTerm);
        });
    });
    $("#project-container").fadeOut("fast");
}
function getData(term){
    $("#loading-view").fadeIn("fast");
    if(!searching){
        searching = true;
        console.log("Searching...");
        $.ajax({
            type: "POST",
            url: "/search",
            data: {question:term}})
            .done(function( result, textStatus, jqXHR ) {
                obj = result;
                console.log(obj);
                $("#loading-view").fadeOut("fast", function(){
                    $("#article-view").fadeIn("fast");
                });
                $("#article-list").empty();

                setupSearchAgain(term);
                addToRecentSearches(term);
                setupData();
                searching = false;
            })
            .fail(function( e, textStatus, errorThrown ) {
                switch (e.status) {
                    case 429:
                        handleError('Currently we are only permitting 5 searches per hour. Please try again in an hour.');
                        break;
                    default:
                        handleError('The server had an error. Please try again later.');
                        break;
                }
            })
    }
}
function handleError(str){
    alert(str);
    window.location = 'index.html';
}

function setupSearchAgain(searchTerm){
    var searchagain = $("#search-again");
    searchagain.unbind( "click" );
    searchagain.click(function(){
        getData(searchTerm);
    })
}
function addToRecentSearches(searchTerm){
    if(projectid){
        var recentKey = firebase.database().ref(userlocation + projectid +"/recent").push().key;
        firebase.database().ref(userlocation + projectid +"/recent/"+recentKey).set(searchTerm);
    }
}

function setupData(){
    appendArticleList();
    setupArticleClick();
}

function appendArticleList(){
    var item = "";
    if(obj != null) {
        for (i = 0; i < obj.length; i++) {
            item += '<div class="article click" link="'+ obj[i].url +'">';
            item += '<div class="article-name-container article-list-elements">';
            item += '<h3 class="article-name">' + obj[i].title + '</h3>';
            item += '<div class="article-journal '+obj[i].journal.charAt(0)+'">'+obj[i].journal.charAt(0)+'</div></div>';
            item += '<h4 class="article-date article-list-elements">' + obj[i].publicationDate + '</h4>';
            item += '<h4 class="article-desc article-list-elements">' + obj[i].summary + '</h4>';
            item += '<div class="article-info article-list-elements"><div class="article-keywords">';
            if (obj[i].keywords != null && obj[i].keywords.length >= 1) {
                for (a = 0; a < obj[i].keywords.length; a++) {
                    item += '<h4 class="mini-keyword">' + obj[i].keywords[a] + '</h4>';
                }
            }
            else {
                item += '<h4 class="article-desc">' + 'No Keywords Found' + '</h4>';
            }
            item += '</div><div class="article-reliability">Bias: '+ parseInt(Math.abs((obj[i].sentiment) * 100)) +'</div></div>';
            item += '<div class="article-buttons-container"><div class="article-tools article-buttons">';
            item += '<div class="keyword-button glyphicon glyphicon-th-list article-tool-button" index="'+i+'"></div>';
            item += '<div class="bibliography-button glyphicon glyphicon-book article-tool-button" index="'+i+'"></div></div>';
            if(loggedIn){
                item += '<div class="article-add article-buttons">';
                item += '<div class="added glyphicon glyphicon-remove article-tool-button"></div>';
                item += '<div class="notes glyphicon glyphicon-pencil article-tool-button"></div>';
                item += '<div class="add glyphicon glyphicon-plus article-tool-button"></div></div>';
            }
            item += '</div></div>';
        }
    }
    else{
        item = "<h4>No Articles Found</h4>";
    }
    $(item).appendTo("#article-list");
}
function setupArticleClick(){
    $( ".article").unbind( "click" );
    // $(".article").click(function(e){
    //     $(".article").removeClass("article-selected");
    //     $(this).addClass("article-selected");
    //     openArticle($(this).attr("link"));
    // });
    $(".keyword-button").unbind("click");
    $(".keyword-button").click(function(){
        showKeywords($(this).attr("index"));
    });
    $(".bibliography-button").unbind("click");
    $(".bibliography-button").click(function () {
        showBibliography($(this).attr("index"));
    });
}
function openArticle(link){
    window.open(link);
}

function showKeywords(index){
    console.log();
    console.log(obj[index].apa);
    $("#keyword-list").empty();
    var str = "";
    for(a = 0; a<obj[index].keywords.length; a++){
        str += '<div class="keyword-entry"><div class="keyword-container">';
        str += '<div class="keyword">' + obj[index].keywords[a] +'</div></div>';
        str += '<div class="keyword-def">' + obj[index].keywords[a] + '</div></div>';
    }
    for(b = 0; b<obj[index].concepts.length; b++){
        str += '<div class="keyword-entry"><div class="keyword-container">';
        str += '<div class="keyword">' + obj[index].concepts[b] +'</div></div>';
        str += '<div class="keyword-def">' + obj[index].concepts[b] + '</div></div>';
    }
    $("#keyword-list").append($(str));
    $("#dictionary").show();
    $("#bibliography").hide();
    $("#popup-view").show();
}
function showBibliography(index){
    $("#apa").html(obj[index].apa);
    $("#mla").html(obj[index].mla);
    $("#chicago").html(obj[index].chicago);
    $("#dictionary").hide();
    $("#bibliography").show();
    $("#popup-view").show();
}

function showFullArticle(idd){
    var art = obj[idd.substring(1)];
    if(art.title == null){
        $(".article-title").html("No Article Title");
    }
    else{
        $(".article-title").html(art.title);
    }
    $( "#link-button").unbind( "click" );
    $("#link-button").click(function(){
        window.open(art.url);
    });
    if(projectid){
        var articlekey = md5(art.title);
        var location = firebase.database().ref(userlocation + projectid +"/articles/");
        location.once('value', function(snapshot) {
            if (snapshot.hasChild(articlekey)) {
                $("#add-button").hide();
            }
            else{
                $("#add-button").show();
                $( "#add-button").unbind( "click" );
                $("#add-button").click(function(){
                    addToProject(art);
                    $("#add-button").hide();
                });
            }
        });
    }
    else{
        $("#add-button").hide();
    }

    var auth = "";
    if(art.authors == null || art.authors.length == 0 || art.authors[0]=="null"){
        auth="No Authors Found";
    }
    else{
        for(a=0; a<art.authors.length; a++){
            if(a>4 && art.authors.length > 5){
                auth+=art.authors[a]+" et al.";
                break;
            }
            if((art.authors.length-1) == a){
                auth+=art.authors[a];
            }
            else{
                auth+=art.authors[a]+", ";
            }
        }
    }
    $(".article-author").text(auth);
    if(art.publicationDate == null){
        $(".article-date").text("No Date Found");
    }
    else{
        $(".article-date").text(art.publicationDate);
    }
    if(art.abstract == null || art.abstract == ""){
        $(".article-text").text("No Abstract Found. Click on link above to view full article.");
    }
    else{
        $(".article-text").text(art.abstract);
    }
    setupHighlight();
    showToolbar(art);
}
function showToolbar(art){
    //Keywords
    $("#keywords").empty();
    var list = "";
    if(art.keywords == null || art.keywords.length==0){
        console.log("No Keywords");
    }
    else{
        for(a=0; a<art.keywords.length; a++){
            list+='<h4 class="list-keyword click">'+art.keywords[a]+'</h4>';
        }
    }

    if(art.concepts == null || art.concepts.length==0){
        console.log("No Concepts");
    }
    else{
        for(b=0; b<art.concepts.length; b++){
            list+='<h4 class="list-keyword click">'+art.concepts[b]+'</h4>';
        }
    }
    $(list).appendTo("#keywords");
    setupKeywordSearch();

    //Bibliography
    if(art.mla == null || art.apa == null || art.mla == "" || art.apa == ""){
        $("#citation").empty();
        var text='<h4>No Citation Found</h4>';
        $(text).appendTo("#citation");
    }
    else{
        if(projectid){
            $( ".citation-button").unbind( "click" );
            $(".citation-button").click(function(){
                changeProjectBibliography(this,art);
            });
            var location = firebase.database().ref(userlocation + projectid+"/type");
            location.on('value', function(snapshot) {
                var type = snapshot.val().type;
                $(".citation-button").removeClass("citation-button-selected");
                $("#"+type).addClass("citation-button-selected");
                selectBibliography(type, art);
            });
        }
        else{
            var type = "APA";
            $( ".citation-button").unbind( "click" );
            $(".citation-button").click(function(){
                changeBibliography(this,art);
            });
            selectBibliography(type, art)
        }
    }
}

function addToProject(art){
    if(projectid){
        var articlekey = md5(art.title);
        // var articlekey = firebase.database().ref(userlocation + projectid +"articles").push().key;
        firebase.database().ref(userlocation + projectid +"/articles/"+articlekey).set(art);
    }
}
function createNotepad(){
    var quill = new Quill('#notes-panel', {
        theme: 'bubble'
    });
    if(projectid){
        var location = firebase.database().ref(userlocation+projectid+"/notes");
        location.once('value').then(function(snapshot) {
            var content = snapshot.val();
            quill.setContents(content);
            quill.on('text-change', function(delta, oldDelta, source) {
                saveNotes(quill);
            });
        });
    }
    else{
        quill.setText('');
    }
}
function saveNotes(quill){
    var contents = quill.getContents();
    var location = firebase.database().ref(userlocation + projectid + "/notes");
    location.set(contents);
}

function changeProjectBibliography(element, art){
    var type = $(element).text();
    var location = firebase.database().ref(userlocation + projectid +"/type");
    location.set(type);
    $(".citation-button").removeClass("citation-button-selected");
    $("#"+type).addClass("citation-button-selected");
    selectBibliography(type, art);
}
function changeBibliography(element, art){
    var type = $(element).text();
    $(".citation-button").removeClass("citation-button-selected");
    $(element).addClass("citation-button-selected");
    selectBibliography(type,art);
}
function selectBibliography(type, art){
    $("#citation").empty();
    var text='<h4>';
    if(type=="APA"){
        text+=art.apa;
    }
    else if(type=="MLA"){
        text+=art.mla;
    }
    text+='</h4>';
    $(text).appendTo("#citation");
}

function changeToKeywords(){
    $(".toolbar").hide();
    $("#keywords").fadeIn("fast");
}
function changeToBibliography(){
    $(".toolbar").hide();
    $("#bibliography").fadeIn("fast");
}
function changeToNotes(){
    $(".toolbar").hide();
    $("#notes").fadeIn("fast");
}
