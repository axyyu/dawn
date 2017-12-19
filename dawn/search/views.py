from django.shortcuts import render
from django.http import HttpResponse, HttpResponseBadRequest
from django.views.decorators.csrf import ensure_csrf_cookie

import requests
import json
import re

from . import databases
from . import analysis
from . import helpers
from . import bibliography


# @ensure_csrf_cookie


def index(request):
    if request.method == 'GET':
        question = request.GET.get('q', None)
        if question is None:
            return render(request, 'index.html')  # Maybe change
        question = question.replace('+', ' ')
        if question[-1] == ' ':
            question = question[:-1]
        databases = ['Nature']
        req = {'question': question,
               'definition': helpers.get_definition(question),
               'related': analysis.get_related(question),
               'data': get_data(question, databases)}
        return render(request, 'results.html', req)
        # return render(request, 'index.html')
    return render(request, 'index.html')


def profile(request):
    return render(request, 'profile.html')


def define(request):
    if request.method == 'GET':
        question = request.GET.get('q', None)
        if question is None:
            return HttpResponseBadRequest
        question = question.replace('+', ' ')
        output = json.dumps({'data': helpers.get_definition(question)})
        return HttpResponse(output, content_type='application/json')


def related(request):
    if request.method == 'GET':
        question = request.GET.get('q', None)
        if question is None:
            return HttpResponseBadRequest
        question = question.replace('+', ' ')
        output = json.dumps({'data': analysis.get_related(question)})
        return HttpResponse(output, content_type='application/json')
    return render(request, 'index.html')


def get_data(question, dbs):
    entity_array = []
    for d in dbs:
        if d == "Nature":
            body = databases.get_nature_journal(question, 3)
            if body:
                if body.get('feed') and body.get('feed').get('entry'):
                    for i in body['feed']['entry']:
                        item = {}
                        item['title'] = i['title']
                        item['url'] = i['link']
                        
                        abstract = i['sru:recordData']['pam:message']['pam:article']['xhtml:head']['dc:description']

                        authors = i['sru:recordData']['pam:message']['pam:article']['xhtml:head']['dc:creator']
                        
                        authors = [ ( a[:a.rfind(" ")] , a[a.rfind(" "):] ) for a in authors ]
                        #item['authorString'] = ", ".join( [ "{} {}".format(a[0], a[1]) for a in authors] )

                        item['publisher'] = i['sru:recordData']['pam:message'][
                            'pam:article']['xhtml:head']['dc:publisher']
                        item['publicationDate'] = i['sru:recordData']['pam:message'][
                            'pam:article']['xhtml:head']['prism:publicationDate']
                        item['journal'] = 'Nature Journal'

                        pubdate = item['publicationDate']
                        item['mla'] = bibliography.get_easy_bib(
                            'mla7', item['title'], item['publisher'], pubdate[0:4], authors)

                        item['apa'] = bibliography.get_easy_bib(
                            'apa', item['title'], item['publisher'], pubdate[0:4], authors)

                        item['chicago'] = bibliography.get_easy_bib(
                            'chicagob', item['title'], item['publisher'], pubdate[0:4], authors)

                        abstract = helpers.filter_article(abstract)

                        item['keywords'] = analysis.get_entities(str(abstract))

                        item['sentiment'] = analysis.get_sentiment(str(abstract))
                        item['summary'] = analysis.get_summary(str(item['title']), str(abstract))

                        entity_array.append(item)
        elif d == "ScienceDirect":
            body = databases.get_science_direct(question)
            if body:
                if body.get('search-results') and body.get('search-results').get('entry'):
                    for i in body['search-results']['entry']:
                        item = {}
                        item['title'] = i['dc:title']
                        item['url'] = i['link'][1]["@href"]

                        doi = i['prism:doi']
                        article = databases.get_science_direct_article(doi)

                        abstract = ""
                        if article and article.get('full-text-retrieval-response') and article.get('full-text-retrieval-response').get('coredata'):
                            abstract = article['full-text-retrieval-response']['coredata']['dc:description']
                            abstract = helpers.filter_article(abstract)
                            item['summary'] = analysis.get_summary(str(item['title']), str(abstract))
                        else:
                            abstract = helpers.filter_article( i['prism:teaser'] )
                            item['summary'] = abstract

                        authors = [ (a['given-name'],a['surname']) for a in i['authors']['author'] ]

                        item['authorString'] = ", ".join( [ "{} {}".format(a[0], a[1]) for a in authors] )

                        item['publisher'] = i['prism:publicationName']
                        item['publicationDate'] = i['prism:coverDate'][0]['$']
                        item['journal'] = 'Science Direct'

                        pubdate = item['publicationDate']
                        item['mla'] = bibliography.get_easy_bib(
                            'mla7', item['title'], item['publisher'], pubdate[0:4], item['authors'])
                        item['apa'] = bibliography.get_easy_bib(
                            'apa', item['title'], item['publisher'], pubdate[0:4], item['authors'])
                        item['chicago'] = bibliography.get_easy_bib(
                            'chicagob', item['title'], item['publisher'], pubdate[0:4], item['authors'])

                        item['keywords'] = analysis.get_entities(str(abstract))
                        item['sentiment'] = analysis.get_sentiment(str(abstract))

                        entity_array.append(item)
        elif d == "CORES":
            pass
    return entity_array
