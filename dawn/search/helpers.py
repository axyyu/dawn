import requests
import json
import re
import wikipedia as wp

def filter_article(string):
    if string is None:
        return ''
    string = re.sub(r'<(?:.|\n)*?>', '', string)
    return string

def get_definition(query):
    try:
        return wp.summary( wp.page(query), sentences=1)
    except wp.exceptions.DisambiguationError as e:
        return wp.summary( wp.page(e.options[0]), sentences=1)
