from django.shortcuts import render
from django.http import HttpResponse, HttpResponseBadRequest
from django.views.decorators.csrf import ensure_csrf_cookie

import requests
import json

@ensure_csrf_cookie
def index(request):
    if request.method == 'POST':
        question = request.POST.get('question')
        if question is None:
            return HttpResponseBadRequest
        question = question.replace("+", " ")
        output = json.dumps({ 'data' : get_nature_journal(question)})
        return HttpResponse(output, content_type='application/json')

    return render(request, 'index.html')
    

def get_nature_journal(question):
    ARTICLE_COUNT = 3;
    KEYWORD_COUNT = 2;

    r = requests.get('http://www.nature.com/opensearch/request?query=' + question + '&httpAccept=application/json&maximumRecords=' + str(ARTICLE_COUNT))
    if r.status_code == requests.codes.ok:
        try:
            body = r.json()
        except:
            console.log("Bad data from Nature")
            return None
        entity_array = []
        if body.get('feed') and body.get('feed').get('entry'):
            print(body)
            for i in body['feed']['entry']:
                item = {}
                item['title'] = i['title']
                item['url'] = i['link']
                item['abstract'] = ''
                item['authors'] = i['sru:recordData']['pam:message']['pam:article']['xhtml:head']['dc:creator']
                item['publisher'] = i['sru:recordData']['pam:message']['pam:article']['xhtml:head']['dc:publisher']
                item['publicationDate'] = i['sru:recordData']['pam:message']['pam:article']['xhtml:head']['prism:publicationDate']
                item['journal'] = 'Nature'
                entity_array.append(json.dumps(item))
            if len(entity_array) == 0:
                return entity_array
            for e in entity_array:
                #do things
                print(entity_array)
            return entity_array

    '''natureJournal(question, function(entityArray) {
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
    return None
