import requests
import json
import re
from havenondemand.hodclient import *

haven_client = HODClient("beb65937-16e4-4015-ad44-77a7f4e41e0c", version="v2")

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

def callback(res, **context):
    return json.dumps(res)

def get_wikipedia(query):
    haven_client.get_request({'text':query}, HODApps.FIND_SIMILAR, async=False, callback=callback)