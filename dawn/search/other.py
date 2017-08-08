import requests
import json
import re
from PyDictionary import PyDictionary
dictionary=PyDictionary()

def filter_article(string):
    if string is None:
        return ''
    string = re.sub(r'<(?:.|\n)*?>', '', string)
    return string

def get_definition(query):
    return dictionary.meaning(query)