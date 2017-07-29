from django.shortcuts import render
from django.http import HttpResponse, HttpResponseBadRequest
from django.views.decorators.csrf import ensure_csrf_cookie

import requests
import json
import re


@ensure_csrf_cookie
def index(request):
    if request.method == 'POST':
        question = request.POST.get('question')
        if question is None:
            return HttpResponseBadRequest
        question = question.replace("+", " ")
        output = json.dumps({'data': get_nature_journal(question)})
        return HttpResponse(output, content_type='application/json')

    return render(request, 'index.html')


def filter_article(string):
    if string is None:
        return ''
    string = re.sub(r'<(?:.|\n)*?>', '', string)
    return string


def get_bib(style, title, pub, year, authors):
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

'''
function getFullArticle(url, callback) {
    request("https://api.diffbot.com/v3/article?token=" + DIFF_key + "&url=" + article, function(error, resp, body) {
        if (!error && resp.statusCode == 200) {
            console.log("diffbot");
            var body = JSON.parse(body);
            var text = body.text;
            callback(text);
        } else {
            console.log(error);
            callback(null);
        }
    });
}
'''
def get_full_article(url):
    r = requests.get(
        'https://api.diffbot.com/v3/article?token=' + 
         DIFF_key + '&url=' + article)

    blank = {}
    if r.status_code == requests.codes.ok:
        try:
            body = r.json()
            return body
        except:
            return json.dumps(blank)

    return json.dumps(blank)

def get_nature_journal(question):
    ARTICLE_COUNT = 3
    KEYWORD_COUNT = 2

    r = requests.get(
        'http://www.nature.com/opensearch/request?query=' +
        question +
        '&httpAccept=application/json&maximumRecords=' +
        str(ARTICLE_COUNT))
    if r.status_code == requests.codes.ok:
        try:
            body = r.json()
        except:
            return None

        entity_array = []
        if body.get('feed') and body.get('feed').get('entry'):
            for i in body['feed']['entry']:
                item = {}
                item['title'] = i['title']
                item['url'] = i['link']
                item['abstract'] = i['sru:recordData']['pam:message'][
                    'pam:article']['xhtml:head']['dc:description']
                item['authors'] = i['sru:recordData']['pam:message'][
                    'pam:article']['xhtml:head']['dc:creator']
                item['publisher'] = i['sru:recordData']['pam:message'][
                    'pam:article']['xhtml:head']['dc:publisher']
                item['publicationDate'] = i['sru:recordData']['pam:message'][
                    'pam:article']['xhtml:head']['prism:publicationDate']
                item['journal'] = 'Nature'
                entity_array.append(item)
            if len(entity_array) == 0:
                return entity_array
            for e in entity_array:
                # FIX HTML TAGS SHOWING UP
                pubdate = e['publicationDate']
                e['mla'] = get_bib(
                    'mla7', e['title'], e['publisher'], pubdate[
                        0:4], e['authors'])
                e['apa'] = get_bib(
                    'apa', e['title'], e['publisher'], pubdate[
                        0:4], e['authors'])
                e['abstract'] = filter_article(e['abstract'])
            return entity_array

            '''languageAnalysis(entry.abstract, function(s, k, c) {
                            entry.sentiment = s;
                            entry.keywords = k;
                            entry.concepts = c;
                            getSummary(entry.abstract, entry.title, 1, function(s) {
                                console.log("\t\t\tgot summary");
                                entry.summary = s;
                                --wait;
                                if (wait == 0) {
                                    response.send(entityArray);
                                }
          });'''
    return None
