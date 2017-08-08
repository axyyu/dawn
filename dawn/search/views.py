from django.shortcuts import render
from django.http import HttpResponse, HttpResponseBadRequest
from django.views.decorators.csrf import ensure_csrf_cookie

import requests
import json
import re

from databases import *
from analysis import *
from other import *
from bibliography import *

# @ensure_csrf_cookie
def index(request):
    if request.method == 'GET':
        question = request.GET.get('q',None)
        if question is None:
            return render(request, 'index.html')
        question = question.replace("+", " ")
        output = json.dumps({'data': get_nature_journal(question)})
        return render(request,'search.html', output)
    return render(request, 'index.html')

def get_nature_journal(question):
    ARTICLE_COUNT = 3
    KEYWORD_COUNT = 2

    r = requests.get(
        'http://www.nature.com/opensearch/request?query=' +
        question +
        '&httpAccept=application/json&maximumRecords=' +
        str(ARTICLE_COUNT))
    if r.status_code == requests.codes.ok:
        try:
            body = r.json()
        except:
            return None

        entity_array = []
        if body.get('feed') and body.get('feed').get('entry'):
            for i in body['feed']['entry']:
                item = {}
                item['title'] = i['title']
                item['url'] = i['link']
                item['abstract'] = i['sru:recordData']['pam:message'][
                    'pam:article']['xhtml:head']['dc:description']
                item['authors'] = i['sru:recordData']['pam:message'][
                    'pam:article']['xhtml:head']['dc:creator']
                item['publisher'] = i['sru:recordData']['pam:message'][
                    'pam:article']['xhtml:head']['dc:publisher']
                item['publicationDate'] = i['sru:recordData']['pam:message'][
                    'pam:article']['xhtml:head']['prism:publicationDate']
                item['journal'] = 'Nature'
                entity_array.append(item)
            if len(entity_array) == 0:
                return entity_array
            for e in entity_array:
                # FIX HTML TAGS SHOWING UP
                pubdate = e['publicationDate']
                e['mla'] = get_bib(
                    'mla7', e['title'], e['publisher'], pubdate[
                        0:4], e['authors'])
                e['apa'] = get_bib(
                    'apa', e['title'], e['publisher'], pubdate[
                        0:4], e['authors'])
                e['abstract'] = filter_article(e['abstract'])
            return entity_array

            '''languageAnalysis(entry.abstract, function(s, k, c) {
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
          });'''
    return None
