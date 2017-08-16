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
        question = request.GET.get('question', None)
        if question is None:
            return render(request, 'index.html')  # Maybe change
        question = question.replace("+", " ")
        databases = ["Nature"]
        val = get_data(question, databases)
        print(val)
        return render(
            request, 'search.html', {
                'question': question, 'data': val})
        # return render(request, 'index.html')
    return render(request, 'index.html')


def define(request):
    if request.method == 'GET':
        question = request.GET.get('question', None)
        if question is None:
            return HttpResponseBadRequest
        question = question.replace("+", " ")
        output = json.dumps({'data': helpers.get_definition(question)})
        return HttpResponse(output, content_type='application/json')
    return render(request, 'index.html')


def related(request):
    if request.method == 'GET':
        question = request.GET.get('question', None)
        if question is None:
            return HttpResponseBadRequest
        question = question.replace("+", " ")
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
                        item['abstract'] = i['sru:recordData']['pam:message'][
                            'pam:article']['xhtml:head']['dc:description']
                        item['authors'] = i['sru:recordData']['pam:message'][
                            'pam:article']['xhtml:head']['dc:creator']
                        item['publisher'] = i['sru:recordData']['pam:message'][
                            'pam:article']['xhtml:head']['dc:publisher']
                        item['publicationDate'] = i['sru:recordData']['pam:message'][
                            'pam:article']['xhtml:head']['prism:publicationDate']
                        item['journal'] = 'Nature'

                        pubdate = item['publicationDate']
                        item['mla'] = bibliography.get_easy_bib(
                            'mla7', item['title'], item['publisher'], item['publicationDate'][
                                0:4], item['authors'])
                        item['apa'] = bibliography.get_easy_bib(
                            'apa', item['title'], item['publisher'], item['publicationDate'][
                                0:4], item['authors'])
                        item['abstract'] = helpers.filter_article(
                            item['abstract'])

                        # item['keywords']=analysis.get_entities(item['abstract'])
                        # item['concepts']=analysis.get_concepts(item['abstract'])
                        # item['sentiment']=analysis.get_sentiment(item['abstract'])
                        # item['summary']=analysis.get_summary(item['abstract'])

                        entity_array.append(item)
                    return entity_array
        elif d == "CORES":
            pass
    return None
