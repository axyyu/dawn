/**
 * Created by andrew on 8/6/17.
 */
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
        getData();
    });
    $("#project-container").fadeOut("fast");
}
function getData(){
    $("#loading-view").fadeIn("fast");
    if(!searching){
        searching = true;
        console.log("Searching...");

        var searchTerm = $("#search-bar").val();
        var dbstring = "";
        for(a = 0; a<dblist.length; a++){
            dbstring += dblist[a]+",";
        }
        console.log(dblist);
        console.log(dbstring);
        if(searchable(searchTerm)){
            // var csrftoken = getCookie('csrftoken');
            //
            // $.ajaxSetup({
            //     beforeSend: function(xhr, settings) {
            //         if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
            //             xhr.setRequestHeader("X-CSRFToken", csrftoken);
            //         }
            //     }
            // });
            $.ajax({
                type: "GET",
                url: "/search/",
                data: {
                    question:searchTerm,
                    db: dbstring
                }})
                .done(function( result, textStatus, jqXHR ) {
                    console.log(result);
                    obj = result['data'];
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
}
function searchable(term){
    return (term.replace(/ /g, 'x') != "");
}
function handleError(str){
    alert(str);
    window.location = '/';
}