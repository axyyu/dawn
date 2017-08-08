import requests
import json
import re

def get_easy_bib(style, title, pub, year, authors):
    auth = []
    if authors is None or len(authors) == 0:
        auth.append(json.dumps({}))
    else:
        for a in authors:
            author = {}
            author['function'] = 'author'
            space = a.find(" ")
            lspace = a.rfind(" ")
            if space == -1:
                author['first'] = ''
                author['middle'] = ''
                author['last'] = ''
            else:
                author['first'] = a[0:space]
                author['middle'] = a[space:lspace]
                author['last'] = a[lspace:]
            auth.append(json.dumps(author))

    payload = {}
    payload['key'] = 'e8d16813ad492175b055390bd9d62c2b'
    payload['source'] = 'journal'
    payload['style'] = style
    payload['journal'] = {'title': filter_article(title)}
    payload['pubtype'] = {'main': 'pubjournal'}
    payload['pubjournal'] = {'title': filter_article(pub), 'year': year}
    payload['contributors'] = auth
    output = json.dumps(payload)
    r = requests.post(
        'https://api.citation-api.com/2.1/rest/cite',
        data=output)

    if r.status_code == requests.codes.ok:
        return r.json()
    else:
        blank = {}
        return json.dumps(blank)