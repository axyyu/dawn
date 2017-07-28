from django.shortcuts import render
from django.http import HttpResponse
from django.views.decorators.csrf import ensure_csrf_cookie

@ensure_csrf_cookie
def index(request):
    if request.method == "POST":
        print(request)
        '''
        var question = str.substring(str.indexOf("=") + 1, str.length);
        question = question.replace(/\+/g, " ");

        natureJournal(question, function(entityArray) {
            console.log("array made");
            var wait = entityArray.length;
            if(wait==0){
                response.send(entityArray);
            }
            entityArray.forEach(function(entry) {
                console.log("entered array");
                getCitationMla(entry.title, entry.publisher, entry.publicationDate.substring(0, 4), entry.authors, function(citation) {
                    console.log("\tgot MLA citation");
                    entry.mla = citation;
                    getCitationApa(entry.title, entry.publisher, entry.publicationDate.substring(0, 4), entry.authors, function(citation) {
                        console.log("\tgot APA citation");
                        entry.apa = citation;
                        entry.abstract = filterArticle(entry.abstract);
                        if( entry.abstract ==null || entry.abstract==""){
                            --wait;
                        }
                        else{
                            languageAnalysis(entry.abstract, function(s, k, c) {
                                console.log("\t\tlanguage analysis");
                                entry.sentiment = s;
                                entry.keywords = k;
                                entry.concepts = c;

                                getSummary(entry.abstract, entry.title, 1, function(s) {
                                    console.log("\t\t\tgot summary");
                                    entry.summary = s;
                                    --wait;
                                    if (wait == 0) {
                                        response.send(entityArray);
                                    }
                                });
                            });
                        }
                    });
                });
            });
        });'''
    return render(request, 'index.html')
