import requests
import json
import re
from havenondemand.hodclient import *

haven_client = HODClient("beb65937-16e4-4015-ad44-77a7f4e41e0c", version="v2")
science_direct = "5291b91ea080e8e6580a7718fdcff571"

def get_nature_journal(question, count):
    r = requests.get(
        'http://www.nature.com/opensearch/request?query=' +
        question +
        '&httpAccept=application/json&sortKeys=publicationDate,pam,0&maximumRecords=' +
        str(count))
    if r.status_code == requests.codes.ok:
        try:
            return r.json()
        except:
            return None
    return None

def get_science_direct(question):
    r = requests.get(
        'https://api.elsevier.com/content/search/scidir?query=' +
        question +
        '&apiKey=' +
        science_direct +
        '&httpAccept=application/json')
    if r.status_code == requests.codes.ok:
        try:
            return r.json()
        except:
            return None
    return None

def get_science_direct_article(pii):
    print( '\n\t https://api.elsevier.com/content/article/pii/' +
        pii +
        '?apiKey=' +
        science_direct +
        '&httpAccept=application/json' )
    r = requests.get(
        'https://api.elsevier.com/content/article/pii/' +
        pii +
        '?apiKey=' +
        science_direct +
        '&httpAccept=application/json')
    if r.status_code == requests.codes.ok:
        try:
            return r.json()
        except:
            return None
    return None



def callback(res, **context):
    return json.dumps(res)


def get_wikipedia(query):
    haven_client.get_request({'text': query},
                             HODApps.FIND_SIMILAR,
                             async=False,
                             callback=callback)
