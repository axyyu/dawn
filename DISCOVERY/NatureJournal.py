from Source import Source
import concurrent.futures
import requests
import re
# from . import bibliography

class NatureJournal(Source):

    def obtain_articles(query, entry_num=1):
        r = requests.get(
            'http://www.nature.com/opensearch/request?query=' +
            query +
            '&httpAccept=application/json&sortKeys=publicationDate,pam,0&maximumRecords=' +
            str(entry_num))
        r.raise_for_status()
        return r.json()

    def obtain_item(result):
        item = {}
        item['title'] = re.sub(r'<(?:.|\n)*?>', '', result['title'].replace('"', '').replace('\'', ''))
        item['url'] = result['link']
        item['abstract'] = result['sru:recordData']['pam:message'][
            'pam:article']['xhtml:head']['dc:description']
        item['text'] = re.sub(r'<(?:.|\n)*?>', '', item['abstract'])

        item['publisher'] = result['sru:recordData']['pam:message'][
            'pam:article']['xhtml:head']['dc:publisher']
        item['publicationDate'] = result['sru:recordData']['pam:message'][
            'pam:article']['xhtml:head']['prism:publicationDate']
        item['journal'] = 'Nature Journal'
        pubdate = item['publicationDate'][0:4]

        authors = result['sru:recordData']['pam:message'][
            'pam:article']['xhtml:head']['dc:creator']
        if authors:
            authors = [(a[:a.rfind(" ")], a[a.rfind(" "):])
                       for a in authors]
            item['authorString'] = ", ".join(
                ["{} {}".format(a[0], a[1]) for a in authors])
        else:
            item['authorString'] = "No Authors"

        # item['mla'] = bibliography.get_easy_bib(
        #     'mla7', item['title'], item['publisher'], pubdate, authors)
        # item['apa'] = bibliography.get_easy_bib(
        #     'apa', item['title'], item['publisher'], pubdate, authors)
        # item['chicago'] = bibliography.get_easy_bib(
        #     'chicagob', item['title'], item['publisher'], pubdate, authors)

        return item

    def parse_response(res):
        data = []
        if res is not None and 'feed' in res:
            if 'entry' in res['feed']:
                entries = res['feed']['entry']
                for result in entries:
                    data.append(NatureJournal.obtain_item(result))
        return data