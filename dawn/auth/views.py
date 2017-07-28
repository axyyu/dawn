from django.shortcuts import render
from django.http import HttpResponse, HttpResponseBadRequest
from django.views.decorators.csrf import ensure_csrf_cookie

import requests
import json
import re


@ensure_csrf_cookie
def index(request):
    return render(request, 'login.html')
