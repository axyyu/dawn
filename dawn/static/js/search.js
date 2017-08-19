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
    setupPopup();
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
    $(".popup-close").click(function () {
        $("#popup-view").hide();
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

function setupPopup() {
    $('#search-def').keydown(function (e) {
       if(e.which ==13){
           addKeyword();
       }
    });

}

function searchAgain() {
    window.location = "/search/?q="+$("#search-bar").val();
}
function relatedTerms(){
    $(".popup-div").hide();
    $("#related").show();
    $("#popup-view").show();
}
function advancedSearch(){

}

function showKeywords(obj){
    $("#keyword-list").empty();
    var childs = $($(obj).find(".keywordcontent")[0]).children();

    var str = "";
    for (a = 0; a < childs.length; a++) {
        str += '<div class="keyword-entry"><div class="keyword-container">';
        str += '<div class="keyword">' + $(childs[a]).text() + '</div></div>';
        str += '<div class="keyword-def">' + $(childs[a]).text() + '</div></div>';
    }
    $("#keyword-list").append($(str));
    $(".popup-div").hide();
    $("#dictionary").show();
    $("#popup-view").show();
}
function showBibliography(obj){
    var childs = $($(obj).find(".bibcontent")[0]);

    var apa = $($(childs).find(".apacontent")[0]).html();
    console.log($(childs).find(".apacontent")[0]);
    console.log(apa);
    var mla = $($(childs).find(".mlacontent")[0]).html();
    var chicago = $($(childs).find(".chicagocontent")[0]).html();

    if(apa != null && apa != ""){
        $("#apa").html(apa);
        $("#apa").parent().show();
    }
    else{
        $("#apa").parent().hide();
    }
    if(mla != null && mla != ""){
        $("#mla").html(mla);
        $("#mla").parent().show();
    }
    else{
        $("#mla").parent().hide();
    }
    if(chicago != null && chicago != ""){
        $("#chicago").html(chicago);
        $("#chicago").parent().show();
    }
    else{
        $("#chicago").parent().hide();
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