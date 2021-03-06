import requests
import json
import re
from . import helpers


def get_easy_bib(style, title, pub, year, authors):
    auth = []
    if authors is None or len(authors) == 0:
        auth.append(json.dumps({}))
    else:
        for a in authors:
            author = {}
            author['function'] = 'author'
            author['first'] = a[0]
            author['middle'] = ''
            author['last'] = a[1]
            auth.append(author)
    payload = {}
    payload['key'] = 'e8d16813ad492175b055390bd9d62c2b'
    payload['source'] = 'journal'
    payload['style'] = style
    payload['journal'] = {'title': helpers.filter_article(title)}
    payload['pubtype'] = {'main': 'pubjournal'}
    payload['pubjournal'] = {
        'title': helpers.filter_article(pub),
        'year': year}
    payload['contributors'] = auth
    output = json.dumps(payload)
    r = requests.post(
        'https://api.citation-api.com/2.1/rest/cite',
        data=output)

    if r.status_code == requests.codes.ok:
        return r.json()['data']
    else:
        blank = {}
        return json.dumps(blank)
