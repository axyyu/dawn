from django.shortcuts import render
from django.http import HttpResponse, HttpResponseBadRequest
from django.views.decorators.csrf import ensure_csrf_cookie

import requests
import json
import re
import concurrent.futures

from . import sources
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
        sources = ['Nature', 'ScienceDirect']
        req = {}
        req['question'] = question
        req['definition'] = helpers.get_definition(question)
        req['related'] = analysis.get_related(question)
        req['data'] = get_data(question, sources)
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


def build_data(source, question):
    source.get_response(question)
    source.parse_data()
    return source.data


def get_data(question, dbs):
    entity_array = []
    threshold = 4
    source_array = []
    for d in dbs:
        if d == "Nature":
            source_array.append(sources.NatureJournal(threshold))
        elif d == "ScienceDirect":
            source_array.append(sources.ScienceDirect(threshold))
        # elif d == "CORES":
        #    pass

    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        future_to_data = {
            executor.submit(
                build_data,
                s,
                question): s.data for s in source_array}
        for future in concurrent.futures.as_completed(future_to_data):
            entity_array.extend(future_to_data[future])
    return entity_array
