import requests
import json
import re
import concurrent.futures
#from havenondemand.hodclient import *

from . import bibliography
from . import helpers
from . import analysis
#haven_client = HODClient("beb65937-16e4-4015-ad44-77a7f4e41e0c", version="v2")


class Source:

    def __init__(self, threshold):
        self.response = None
        self.data = []
        self.threshold = threshold


class NatureJournal(Source):

    def __str__(self):
        return "NatureJournal"

    def get_response(self, question):
        r = requests.get(
            'http://www.nature.com/opensearch/request?query=' +
            question +
            '&httpAccept=application/json&sortKeys=publicationDate,pam,0&maximumRecords=' +
            str(self.threshold))
        if r.status_code == requests.codes.ok:
            try:
                self.response = r.json()
            except:
                print('Invalid response from Nature Journal')

    def convert_result(self, result):
        item = {}
        item['title'] = result['title']
        item['url'] = result['link']
        abstract = result['sru:recordData']['pam:message'][
            'pam:article']['xhtml:head']['dc:description']
        authors = result['sru:recordData']['pam:message'][
            'pam:article']['xhtml:head']['dc:creator']
        if authors:
            authors = [(a[:a.rfind(" ")], a[a.rfind(" "):])
                       for a in authors]
            item['authorString'] = ", ".join(
                ["{} {}".format(a[0], a[1]) for a in authors])
        else:
            item['authorString'] = "No Authors"
        item['publisher'] = result['sru:recordData']['pam:message'][
            'pam:article']['xhtml:head']['dc:publisher']
        item['publicationDate'] = result['sru:recordData']['pam:message'][
            'pam:article']['xhtml:head']['prism:publicationDate']
        item['journal'] = 'Nature Journal'
        pubdate = item['publicationDate'][0:4]
        item['mla'] = bibliography.get_easy_bib(
            'mla7', item['title'], item['publisher'], pubdate, authors)
        item['apa'] = bibliography.get_easy_bib(
            'apa', item['title'], item['publisher'], pubdate, authors)
        item['chicago'] = bibliography.get_easy_bib(
            'chicagob', item['title'], item['publisher'], pubdate, authors)
        abstract = helpers.filter_article(abstract)
        item['keywords'] = analysis.get_entities(str(abstract))
        item['sentiment'] = analysis.get_sentiment(
            str(abstract))
        item['summary'] = analysis.get_summary(
            str(item['title']), str(abstract))
        return item

    def parse_data(self):
        if self.response is not None and self.response[
                'feed'] and self.response['feed']['entry']:
            entries = self.response['feed']['entry']
            if len(entries) > self.threshold:
                entries = entries[:self.threshold]
            with concurrent.futures.ThreadPoolExecutor(max_workers=self.threshold) as executor:
                future_to_items = {
                    executor.submit(
                        self.convert_result,
                        result): result for result in entries}
                for future in concurrent.futures.as_completed(future_to_items):
                    try:
                        self.data.append(future.result())
                    except Exception as e:
                        print('NatureJournal generated an exception: %s', e)


class ScienceDirect(Source):

    API_KEY = "5291b91ea080e8e6580a7718fdcff571"

    def __str__(self):
        return "NatureJournal"

    def get_response(self, question):
        r = requests.get(
            'https://api.elsevier.com/content/search/scidir?query=' +
            question +
            '&apiKey=' +
            self.API_KEY +
            '&httpAccept=application/json')
        if r.status_code == requests.codes.ok:
            try:
                self.response = r.json()
            except:
                print('Invalid response from Science Direct')

    def convert_result(self, result):
        item = {}
        item['title'] = result['dc:title']
        item['url'] = result['link'][1]["@href"]
        pii = result['pii']
        article = self.get_article(pii)  # make async
        abstract = ""
        try:
            abstract = article[
                'full-text-retrieval-response']['coredata']['dc:description']
            abstract = helpers.filter_article(abstract)
            item['summary'] = analysis.get_summary(
                str(item['title']), str(abstract))
        except:
            abstract = helpers.filter_article(
                result['prism:teaser'])
            item['summary'] = abstract
        # if article and article.get('full-text-retrieval-response') and article.get('full-text-retrieval-response').get('coredata'):
        #     abstract = article['full-text-retrieval-response']['coredata']['dc:description']
        #     abstract = helpers.filter_article(abstract)
        #     item['summary'] = analysis.get_summary(str(item['title']), str(abstract))
        # else:
        #     abstract = helpers.filter_article( result['prism:teaser'] )
        #     item['summary'] = abstract
        authors = [(a['given-name'], a['surname'])
                   for a in result['authors']['author']]
        item['authorString'] = ", ".join(
            ["{} {}".format(a[0], a[1]) for a in authors])
        item['publisher'] = result['prism:publicationName']
        item['publicationDate'] = result['prism:coverDate'][0]['$']
        item['journal'] = 'Science Direct'
        pubdate = item['publicationDate'][0:4]
        item['mla'] = bibliography.get_easy_bib(
            'mla7', item['title'], item['publisher'], pubdate, authors)
        item['apa'] = bibliography.get_easy_bib(
            'chicagob', item['title'], item['publisher'], pubdate, authors)
        item['keywords'] = analysis.get_entities(str(abstract))
        item['sentiment'] = analysis.get_sentiment(
            str(abstract))
        return item

    def parse_data(self):
        if self.response[
                'search-results'] and self.response['search-results']['entry']:
            entries = self.response['search-results']['entry']
            if len(entries) > self.threshold:
                entries = entries[:self.threshold]
            with concurrent.futures.ThreadPoolExecutor(max_workers=self.threshold) as executor:
                future_to_items = {
                    executor.submit(
                        self.convert_result,
                        result): result for result in entries}
                for future in concurrent.futures.as_completed(future_to_items):
                    try:
                        self.data.append(future.result())
                    except Exception as e:
                        print('ScienceDirect generated an exception: %s', e)

    def get_article(self, pii):
        # print('\n\t https://api.elsevier.com/content/article/pii/' +
        #      pii +
        #      '?apiKey=' +
        #      self.API_KEY+
        #      '&httpAccept=application/json')
        r = requests.get(
            'https://api.elsevier.com/content/article/pii/' +
            pii +
            '?apiKey=' +
            self.API_KEY +
            '&httpAccept=application/json')
        if r.status_code == requests.codes.ok:
            try:
                return r.json()
            except:
                return None
        return None

'''
def callback(res, **context):
    return json.dumps(res)


def get_wikipedia(query):
    haven_client.get_request({'text': query},
                             HODApps.FIND_SIMILAR,
                             async=False,
                             callback=callback)
'''
