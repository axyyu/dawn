import requests
import json
import re
from PyDictionary import PyDictionary

dictionary = PyDictionary()


def filter_article(string):
    if string is None:
        return ''
    string = re.sub(r'<(?:.|\n)*?>', '', string)
    return string


def get_definition(query):
    temp = ""
    val = dictionary.meaning(query)
    if val is None:
        temp = "None"
    else:
        for k in val:
            temp += k + ": " + val[k][0] + "\n"
    return temp