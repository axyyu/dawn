//Globals
var uid;
var projectid;
var userlocation;

var newcitation="APA";
var setcitation;

$(document).ready(function(){
    $("#logo-icon").click(function(){
        window.location = 'index.html';
    });
    setupAccountButtons();
    setupFirebase();
    setupAddProject();
});
function setupFirebase(){
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            uid = user.uid;
            userlocation = 'users/' + uid +'/';
            retrieveProjects();
        } else {
            window.location = 'login.html';
        }
    });
}
function retrieveProjects(){
    var location = firebase.database().ref(userlocation);
    location.on('value', function(snapshot) {
        $("#project-list").empty();
        if(snapshot.val() == null || snapshot.val().length ==0){
            $('<h2 style="text-align: center">No Projects Found</h2>').appendTo("#project-list");
        }
        $.each(snapshot.val(), function(k, v) {
            var project = '<div class="project click" id='+k+'><div class="project-name-container project-list-elements">';
            project+='<h3 class="project-name project-title">'+v.name+'</h3>';
            project+='<h4 class="project-type">'+v.type+'</h4></div>';
            project+='<div class="project-details">';
            if(v.articles == null || v.articles.length==0){
                project+='<div class="project-button project-count">No Articles</div>';
            }
            else{
                project+='<div class="project-button project-count">Articles: '+v.articles.length+'</div>';
            }
            project+='<div title="Delete" class="project-button glyphicon glyphicon-trash click" onclick="deleteProject(\''+""+k+'\')">';
            project+= '</div></div></div>';
            $(project).appendTo("#project-list");
        });
        $("#loading-view").hide();
        $("#profile-view").fadeIn();
        clickProject();
    });
}

function setupAddProject(){
    $("#add-project").click(function() {
        newcitation = "APA";
        $("#project-list").hide();
        $("#project-form").fadeIn("fast");
    });
    $("#cancel").click(function(){
        $("#project-form").hide();
        $("#project-list").fadeIn("fast");
    });
    $("#add").click(function(){
        addProject();
    });
    $(".project-citation-button").click(function(){
        newcitation = $(this).text();
        $(".project-citation-button").removeClass("citation-selected");
        $("#"+newcitation+"-form").addClass("citation-selected");
    });
}
function addProject(){
    var name = $("#project-form-input").val();
    var projectKey = firebase.database().ref(userlocation).push().key;
    firebase.database().ref(userlocation+projectKey+"/name").set(name);
    firebase.database().ref(userlocation+projectKey+"/type").set(newcitation);
    populateArticleTab(projectKey);
    $("#project-form").hide();
    $("#project-list").fadeIn("fast");
}
function deleteProject(projectKey){
    firebase.database().ref(userlocation+projectKey).remove();
}

function clickProject(){
    $(".project").click(function(e){
        $(".project").removeClass("project-selected");
        $(this).addClass("project-selected");
        populateArticleTab($(this).attr("id"));
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
var htmlString = $(‘<html>’).html(<'html xmlns="http://www.w3.org/TR/REC-ht..." xmlns:office="urn:schemas-microsoft-com:office:office" xmlns:word="urn:schemas-microsoft-com:office:word">' + '<head>' + '<xml>' + '<word:WordDocument>' + '<word:Zoom>90</word:Zoom>' + '<word:DoNotOptimizeForBrowser/>' + '</word:WordDocument>' + '</xml>'
+ '</head>' +'<body>' + 
'<h1>A word document</h1>' +
'<p>This is the content of the word document</p>' +
'</body>'
).get().outerHTML;
var byteNumbers = new Uint8Array(htmlString.length);
for (var i = 0; i < htmlString.length; i++) {
byteNumbers[i] = htmlString.charCodeAt(i);
}
var blob = new Blob([byteNumbers], {type: 'text/html'});
window.saveAs(blob, 'workcited.doc');
}
function exportNotes() {

}
function saveSettings() {

}