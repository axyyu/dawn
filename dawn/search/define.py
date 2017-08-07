from django.shortcuts import render
from django.http import HttpResponse, HttpResponseBadRequest
from django.views.decorators.csrf import ensure_csrf_cookie

import requests
import json
import re

@ensure_csrf_cookie
def index(request):
    if request.method == 'POST':
        question = request.POST.get('query')
        if question is None:
            return HttpResponseBadRequest
        question = question.replace("+", " ")
        output = json.dumps({'data': get_definition(question)})
        return HttpResponse(output, content_type='application/json')

    return render(request, 'index.html')