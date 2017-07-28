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
    // createNotepad();
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
                // resetInfo();
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

function resetInfo(){
    $("#article-list").empty();
}
function setupSearchAgain(searchTerm){
    $( "#search-again").unbind( "click" );
    $("#search-again").click(function(){
        getData(searchTerm);
    })
}

function setupKeywordSearch(){
    $(".list-keyword").mousedown(function(e){
        if( e.button == 0 ){
            $(".list-keyword").removeClass("list-keyword-selected");
            $(this).addClass("list-keyword-selected");
            $('.article-text').removeHighlight();
            $('.article-text').highlight($(this).text());
        }
        if( e.button == 2 ) {
            e.preventDefault();
            var val = $(this).text();
            getData(val);
            $("#search-bar").val(val);
        }
    });
    $('.list-keyword').on('contextmenu', function(){
        return false;
    });
}
function setupArticleClick(){
    $( ".article").unbind( "click" );
    $(".article").click(function(e){
        $(".article").removeClass("article-selected");
        $(this).addClass("article-selected");
        showFullArticle($(this).attr("id"));
    });
}

function addToRecentSearches(searchTerm){
    if(projectid){
        var recentKey = firebase.database().ref(userlocation + projectid +"/recent").push().key;
        firebase.database().ref(userlocation + projectid +"/recent/"+recentKey).set(searchTerm);
    }
}
function setupData(){
    appendArticleList();
}

function appendArticleList(){
    var item = "";
    if(obj != null) {
        for (i = 0; i < obj.length; i++) {
            item += '<div class="article click" id="A' + i + '"><div class="article-name-container article-list-elements">';
            item += '<h3 class="article-name">' + obj[i].title + '</h3>';
            item += '<div class="article-journal ' + obj[i].journal.charAt(0) + '">' + obj[i].journal.charAt(0) + '</div>';
            item += '</div>';
            if (obj[i].summary) {
                item += '<h4 class="article-desc article-list-elements">' + obj[i].summary + '</h4>';
            }
            else {
                item += '<h4 class="article-desc article-list-elements">' + 'Summary not found.' + '</h4>';
            }
            item += '<div class="article-keywords article-list-elements">';
            if (obj[i].keywords != null && obj[i].keywords.length >= 1) {
                var l = 5;
                if (obj[i].keywords.length < 5) {
                    l = obj[i].keywords.length;
                }
                for (a = 0; a < l; a++) {
                    item += '<h4 class="mini-keyword">' + obj[i].keywords[a] + '</h4>';
                }
            }
            else {
                item += '<h4 class="article-desc">' + 'No Keywords Found' + '</h4>';
            }
            item += '</div><div class="article-reliability" id="R' + i + '">';
            if (obj[i].sentiment) {
                item += 'Bias: ' + parseInt(Math.abs((obj[i].sentiment) * 100));
            }
            else {
                item += 'Can\'t Determine Reliability';
            }
            item += '</div></div>';
        }
    }
    else{
        item = "<h4>No Articles Found</h4>";
    }
    $(item).appendTo("#article-list");
    setupArticleClick();

    // for(c = 0; c<obj.length;c++){
    //     var percen = parseInt(Math.abs((obj[c].sentiment)*100));
    //     var bar = new ProgressBar.Line("#R"+i, {
    //         strokeWidth: 4,
    //         easing: 'easeInOut',
    //         duration: 1400,
    //         color: '#ffca82',
    //         fill: 'rgba(255, 255, 255, 0.1)',
    //         trailColor: '#eee',
    //         trailWidth: 1,
    //         svgStyle: {width: (percen/2)+"%", height: '100%'}
    //     });
    //
    //     bar.animate(.2);
    // }
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
