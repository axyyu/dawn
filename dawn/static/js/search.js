/**
 * Created by andre on 4/8/2017.
 */

//Globals
var searchPage = false;
var obj;
var loggedIn = false;
var searching = false;
var dblist = [];

var uid;
var projectid;
var userlocation;

var idTracker = 0;
var highlightedSpan = null;

$(document).ready(function(){
    firebaseChange();
    setupIconButtons();
    setupSearchBar();
    setupDatabaseList();
});
function firebaseChange(){
    firebase.auth().onAuthStateChanged(function(user) {
        if(searchPage){
            window.location='/';
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
                    window.location = '/';
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
        window.location = '/';
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
    $("#search-again").click(function(){
        getData();
    });
    $("#search-def").keydown(function(event){
        if(event.which=="13")
        {
            addKeyword();
        }
    });
    $("#related-terms").click(function(){
        relatedTerms();
    });
    $(".list-input").keydown(function (e) {
        // Allow: backspace, delete, tab, escape, enter and .
        if ($.inArray(e.keyCode, [46, 8, 9, 27, 13, 110, 190]) !== -1 ||
            // Allow: Ctrl/cmd+A
            (e.keyCode == 65 && (e.ctrlKey === true || e.metaKey === true)) ||
            // Allow: Ctrl/cmd+C
            (e.keyCode == 67 && (e.ctrlKey === true || e.metaKey === true)) ||
            // Allow: Ctrl/cmd+X
            (e.keyCode == 88 && (e.ctrlKey === true || e.metaKey === true)) ||
            // Allow: home, end, left, right
            (e.keyCode >= 35 && e.keyCode <= 39)) {
            // let it happen, don't do anything
            return;
        }
        // Ensure that it is a number and stop the keypress
        if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
            e.preventDefault();
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
    $( "#project-dropdown").show();
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
function setupDatabaseList(){
    $(".database-list-element").click(function(){
        if($(this).hasClass("selected-db")){
            $(this).removeClass("selected-db");
            dblist.splice(dblist.indexOf($(this.text())),1);
        }
        else{
            $(this).addClass("selected-db");
            dblist.push($(this).text());
        }
    });
}

function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = jQuery.trim(cookies[i]);
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
function csrfSafeMethod(method) {
    // these HTTP methods do not require CSRF protection
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
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
            getData();
        });
    });
    $("#project-container").fadeOut("fast");
}
function getData(){
    $("#loading-view").fadeIn("fast");
    if(!searching){
        searching = true;
        console.log("Searching...");

        var searchTerm = $("#search-bar").val();
        var startDate = $("#date-begin").val();
        var endDate = $("#date-end").val();
        if(searchable(searchTerm)){
            var csrftoken = getCookie('csrftoken');

            $.ajaxSetup({
                beforeSend: function(xhr, settings) {
                    if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                        xhr.setRequestHeader("X-CSRFToken", csrftoken);
                    }
                }
            });
            $.ajax({
                type: "POST",
                url: "/search/",
                data: {
                    question:searchTerm,
                    start:startDate,
                    end:endDate,
                    db: dblist
                }})
                .done(function( result, textStatus, jqXHR ) {
                    obj = result['data'];
                    console.log(obj);
                    $("#loading-view").fadeOut("fast", function(){
                        $("#article-view").fadeIn("fast");
                    });
                    $("#article-list").empty();

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
    else{
        $("#loading-view").fadeOut("fast", function(){
            $("#article-view").fadeIn("fast");
        });
        $("#article-list").empty();
    }
}
function searchable(term){
    return (term.replace(/ /g, 'x') != "");
}
function handleError(str){
    alert(str);
    window.location = 'index.html';
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
            item += '<div class="article">';
            item += '<div class="article-name-container article-list-elements">';
            item += '<h3 class="article-name">';
            item += '<a class="article-link" href="'+ obj[i].url +'" target="_blank">';
            item += obj[i].title + '</a></h3>';
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
    $(".keyword-button").unbind("click");
    $(".keyword-button").click(function(){
        showKeywords($(this).attr("index"));
    });
    $(".bibliography-button").unbind("click");
    $(".bibliography-button").click(function () {
        showBibliography($(this).attr("index"));
    });
}

function showKeywords(index){
    console.log();
    $("#keyword-list").empty();
    if(obj[index].keywords != null) {
        var str = "";
        for (a = 0; a < obj[index].keywords.length; a++) {
            str += '<div class="keyword-entry"><div class="keyword-container">';
            str += '<div class="keyword">' + obj[index].keywords[a] + '</div></div>';
            str += '<div class="keyword-def">' + obj[index].keywords[a] + '</div></div>';
        }
        for (b = 0; b < obj[index].concepts.length; b++) {
            str += '<div class="keyword-entry"><div class="keyword-container">';
            str += '<div class="keyword">' + obj[index].concepts[b] + '</div></div>';
            str += '<div class="keyword-def">' + obj[index].concepts[b] + '</div></div>';
        }
        $("#keyword-list").append($(str));
    }
    $(".popup-div").hide();
    $("#dictionary").show();
    $("#popup-view").show();
}
function showBibliography(index){
    if(obj[index].apa != null){
        $("#apa").html(obj[index].apa['data']);
        $(".apa").show();
    }
    else{
        $(".apa").hide();
    }
    if(obj[index].mla != null){
        $("#mla").html(obj[index].mla['data']);
        $(".mla").show();
    }
    else{
        $(".mla").hide();
    }
    if(obj[index].chicago != null){
        $("#chicago").html(obj[index].chicago['data']);
        $(".chicago").show();
    }
    else{
        $(".chicago").hide();
    }
    $(".popup-div").hide();
    $("#bibliography").show();
    $("#popup-view").show();
}

function addKeyword(){
    var searchTerm = $("#search-def").val();

    if(searchable(searchTerm)) {
        var csrftoken = getCookie('csrftoken');

        $.ajaxSetup({
            beforeSend: function (xhr, settings) {
                if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                    xhr.setRequestHeader("X-CSRFToken", csrftoken);
                }
            }
        });
        $.ajax({
            type: "POST",
            url: "/define/",
            data: {
                term: searchTerm
            }
        })
            .done(function (result, textStatus, jqXHR) {
                obj = result['data'];
                console.log(obj);

                var str = "";
                str += '<div class="keyword-entry"><div class="keyword-container">';
                str += '<div class="keyword">' + searchTerm + '</div></div>';
                str += '<div class="keyword-def">' + obj.definition + '</div></div>';
                $("#keyword-list").append($(str));
            })
            .fail(function (e, textStatus, errorThrown) {
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
function relatedTerms(){
    var searchTerm = $("#search-bar").val();

    if(searchable(searchTerm)) {
        var csrftoken = getCookie('csrftoken');

        $.ajaxSetup({
            beforeSend: function (xhr, settings) {
                if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                    xhr.setRequestHeader("X-CSRFToken", csrftoken);
                }
            }
        });
        $.ajax({
            type: "POST",
            url: "/related/",
            data: {
                term: searchTerm
            }
        })
            .done(function (result, textStatus, jqXHR) {
                obj = result['data'];
                console.log(obj);

                $("#related-list").empty();
                var str = "";
                str += '<div class="related-row"><div class="related-term">';
                str += searchTerm+'</div></div>';

                for(a=0; a<obj.length; a++){
                    str += '<div class="related-row">';
                    for(b=0; b<obj[a].length; b++){
                        str += '<div class="related-term">'+obj[a][b]+'</div>';
                    }
                    str +='div';
                }
                $("#recent-terms").append($(str));

                $(".popup-div").hide();
                $("#recent-terms").show();
                $("#popup-view").show();
            })
            .fail(function (e, textStatus, errorThrown) {
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
    else{

    }
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
