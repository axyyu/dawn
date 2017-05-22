//Globals
var uid;
var userlocation;
var quill;
var newcitation="APA";
var setcitation;

$(document).ready(function(){
    setupFirebase();
    setupAddProject();
    setupIconButtons();
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
                project+='<div class="project-button project-count">Articles: '+Object.keys(v.articles).length+'</div>';
            }
            project+='<div title="Delete" class="project-button glyphicon glyphicon-trash click" onclick="deleteProject(\''+""+k+'\')">';
            project+= '</div></div></div>';
            $(project).appendTo("#project-list");
        });
        $("#loading-view").hide();
        $("#profile-view").fadeIn("fast");
        clickProject();
    });
}

function setupIconButtons(){
    $("#logo-icon").click(function(){
        window.location = 'index.html';
    });
    $("#account-logout").click(function(){
        firebase.auth().signOut().then(function() {
            window.location = 'index.html';
        }).catch(function(error) {
            alert("There was an error signing out.");
        });
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
            $("#project-tab").fadeIn("fast");
        });
    });
}
function populateArticleTab(projectKey){
    displayRecents(projectKey);
    displayArticles(projectKey);
    displayNotes(projectKey);
    setupSettings(projectKey);
}

function displayRecents(projectKey){
    var location = firebase.database().ref(userlocation+projectKey+"/recent");
    location.on('value', function(snapshot) {
        $("#recent-terms").empty();
        if(snapshot.val() == null || snapshot.val().length ==0){
            $('<h4 style="text-align: center">No Recent Searches Found</h4>').appendTo("#recent-terms");
        }
        $.each(snapshot.val(), function(k, v) {
            var items = "";
            items+='<h4 class="recent-term">'+v+'</h4>';
            $(items).appendTo("#recent-terms");
        });
    });
}
function displayArticles(projectKey){
    var location = firebase.database().ref(userlocation+projectKey+"/articles");
    location.on('value', function(snapshot) {
        $("#articles-list").empty();
        if(snapshot.val() == null || snapshot.val().length ==0){
            $('<h4 style="text-align: center">No Articles Found</h4>').appendTo("#articles-list");
        }
        $.each(snapshot.val(), function(k, v) {
            var items = "";
            items+='<div id="'+k+'" class="article click" class="scrollbar style-1">';
            items+='<h3 class="article-name">'+v.title+'</h3>';
            items+='<div title="Delete" id="'+k+'" class="article-delete glyphicon glyphicon-trash click">';
            items+='</div></div>';
            $(items).appendTo("#articles-list");
            $("#save-button").attr("onclick",'saveSettings("'+projectKey+'")');
        });
        setupArticleClick(projectKey);
        $("#export-bibliography").attr("onclick",'exportBibliography("'+projectKey+'")');
    });
}
function displayNotes(projectKey){
    quill = new Quill('#notes', {
        theme: 'bubble'
    });
    var location = firebase.database().ref(userlocation+projectKey+"/notes");
    location.once('value').then(function(snapshot) {
        var content = snapshot.val();
        quill.setContents(content);
        quill.disable();
    });
}
function setupSettings(projectKey){
    var location = firebase.database().ref(userlocation+projectKey+"/type");
    location.on('value', function(snapshot) {
        var type = snapshot.val();
        setcitation = type;
        $(".citation-button").removeClass("selected");
        $("#"+type+"-settings").addClass("selected");
        $(".citation-button").click(function(){
            setcitation = $(this).text();
            $(".citation-button").removeClass("selected");
            $("#"+newcitation+"-settings").addClass("selected");
        })
    });
    var location2 = firebase.database().ref(userlocation+projectKey+"/name");
    location2.on('value', function(snapshot) {
        var name = snapshot.val();
        $("#project-name-input").val(name);
    });

    $("#save-button").attr("onclick",'saveSettings("'+projectKey+'")');
}

function setupArticleClick(projectKey){
    $(".article").click(function(){
        var articleKey = $(this).attr("id");
        openArticle(projectKey,articleKey);
        $("#article-list-container").hide();
        $("#article-container").fadeIn("fast");
    });
    $(".article-delete").click(function(){
        var articleKey = $(this).attr("id");
        removeArticle(projectKey,articleKey);
    });
}
function openArticle(projectKey, articleKey){
    var location = firebase.database().ref(userlocation+projectKey+"/articles/"+articleKey);
    location.on('value', function(snapshot) {
        if(snapshot.val() == null){
            $(".article-title").html("No Article Title");
            $(".article-author").text("No Authors Found");
            $(".article-date").text("No Date Found");
        }
        else{
            var art = snapshot.val();
            if(art.title == null){
                $(".article-title").html("No Article Title");
            }
            else{
                $(".article-title").html(art.title);
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
        }
        $("#link-button").click(function(){
            window.open(snapshot.val().url);
        });
        $("#delete-article").click(function(){
            removeArticle(projectKey,articleKey);
        });
        $("#back-article").click(function(){
            $("#article-container").hide();
            $("#article-list-container").fadeIn("fast");
        });
    });
}
function removeArticle(projectKey, articleKey){
    $("#article-container").hide();
    $("#article-list-container").fadeIn("fast");
    var location = firebase.database().ref(userlocation+projectKey+"/articles/"+articleKey);
    location.remove();
}

function getbibliography(projectKey){
    var location = firebase.database().ref(userlocation+projectKey+"/articles");
    location.on('value', function(snapshot) {
        var type = setcitation;
        var workscited = [];
        $.each(snapshot.val(), function(k, v) {
            if(type=="MLA"){
                workscited.push(v.mla);
            }
            else if(type=="APA"){
                workscited.push(v.apa);
            }
        });
        workscited.sort();
        outputBibliography(workscited);
    });
}
function outputBibliography(works){
    var doc = new jsPDF({
        unit: 'in'
    });
    doc.setFont("times","normal");
    doc.setFontSize("12");
    doc.setLineWidth(6);
    doc.text(works, 1, 1);
    doc.save('bibliography.pdf');
    $("#export-bibliography").show();
}

function exportBibliography(projectkey){
    $("#export-bibliography").hide();
    getbibliography(projectkey);
}
function exportNotes() {
    var string = quill.getText();
    // var htmlString = $('<html').html('<html xmlns="http://www.w3.org/TR/REC-ht..." xmlns:office="urn:schemas-microsoft-com:office:office" xmlns:word="urn:schemas-microsoft-com:office:word">' + '<head>' + '<xml>' + '<word:WordDocument>' + '<word:Zoom>90</word:Zoom>' + '<word:DoNotOptimizeForBrowser/>' + '</word:WordDocument>' + '</xml>'
    //     + '</head>' +'<body>' + 
    //     '<p>' + string + '</p>' +
    //     '</body>' + '</html>'
    // ).get().outerHTML;
    // console.log(htmlString)
    // htmlString = htmlString.toString();
    // var byteNumbers = new Uint8Array(htmlString.length);
    // for (var i = 0; i < htmlString.length; i++) {
    //     byteNumbers[i] = htmlString.charCodeAt(i);
    // }
    // var blob = new Blob([byteNumbers], {type: 'text/html'});
    // window.saveAs(blob, 'notes.doc');
    // var dataUri = 'data:text/html,' + encodeURIComponent(htmlString);
    // var a = document.getElementById('exportNotes')
    // a.href= "" + dataUri
    var doc = new jsPDF()
    doc.text(string, 10, 10)
    doc.save('notes.pdf')
}
function saveSettings(projectKey) {
    var newname = $("#project-name-input").val();
    var location = firebase.database().ref(userlocation+projectKey+"/type");
    location.set(setcitation);
    var location2 = firebase.database().ref(userlocation+projectKey+"/name");
    location2.set(newname);
}
