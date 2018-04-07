import requests
import json
import re
import spacy
from aylienapiclient import textapi
from havenondemand.hodclient import *

haven_client = HODClient("beb65937-16e4-4015-ad44-77a7f4e41e0c", version="v2")
aylien_client = textapi.Client("424a577c", "4658a8a1d5404e30296418287bbb5aa0")


def callback(res, **context):
    return json.dumps(res)

# HAVEN
# def get_concepts(article):
#     payload = {}
#     payload['text'] = article
#     haven_client.get_request(payload, HODApps.CONCEPT_EXTRACTION, async=False, callback=callback)
#
# def get_related_concepts(query):
#     payload = {}
#     payload['text'] = query
#     haven_client.get_request(payload, HODApps.RELATED_CONCEPTS, async=False, callback=callback)
#
# def get_entities(query):
#     payload = {}
#     payload['text'] = query
#     payload['entity_type'] = ['people_eng', 'places_eng', 'companies_eng', 'compliance_eng', 'drugs_eng', 'films_eng',
#                               'holidays_eng', 'medical_conditions_eng', 'organizations_eng', 'professions_eng',
#                               'teams_eng']
#     haven_client.get_request(payload, HODApps.ENTITY_EXTRACTION, async=False, callback=callback)
#
# def get_variations(query):
#     payload = {}
#     payload['text'] = query
#     payload['expansion'] = 'stem'
#     haven_client.get_request(payload, HODApps.EXPAND_TERMS, async=False, callback=callback)
#
# def get_sentiment(query):
#     payload = {}
#     payload['text'] = query
#     haven_client.get_request(payload, HODApps.SENTIMENT_ANALYSIS, async=False, callback=callback)

# AYLIEN

# def get_sentiment(query):
#     sentiment = aylien_client.Sentiment({'text': query})
#     return ("%.2f" % sentiment['polarity_confidence'])


# def get_related(query):
#     related = aylien_client.Related({"phrase": query})
#     temp = [a['phrase'] for a in related['related']]
#     return filterExtra(query, temp)


# def get_entities(query):
#     entities = aylien_client.Entities({"text": query})
#     if entities.get('entities') and entities.get('entities').get('keyword'):
#         temp = [x for x in entities['entities']['keyword'] if len(x) < 25]
#         return filterExtra(query, temp)
#     return []

# def get_concepts(query):
#     concepts = aylien_client.Concepts({"text": query})
#     temp = [concepts['concepts'][k]['surfaceForms'][0]['string']
#             for k in concepts['concepts']]
#     temp = [x for x in temp if len(x) < 20]
#     return temp


# def get_summary(title, query):
#     try:
#         summary = aylien_client.Summarize(
#             {'title': title, 'text': query, 'sentences_number': 2})
#         temp = ""
#         for sentence in summary['sentences']:
#             temp += sentence
#         if len(temp) < 10:
#             return query
#         return temp
#     except RuntimeError:
#         return query


# HELPER FUNCTIONS

"""
SPACY NLP
"""

nlp = spacy.load('en')
appropriate_entities = [
    'PERSON',
    'NORP',
    'FACILITY',
    'ORG',
    'GPE',
    'LOC',
    'PRODUCT',
    'EVENT',
    'WORK_OF_ART',
    'LAW'
]

def filter_extra(query, array):
    # token = nlp(query)

    # query_filter = set()
    # for a in array[:5]:
    #     if len(a) > 1:
    #         token2 = nlp(a)
    #         sim = token.similarity(token2)
    #         if sim < .7:
    #             query_filter.add(a)

    # results_filter = set()
    # for a in query_filter:
    #     for b in query_filter:
    #         if a != b:
    #             t1 = nlp(a)
    #             t2 = nlp(b)
    #             sim = t1.similarity(t2)
    #             if sim > .8 and b not in results_filter:
    #                 results_filter.add(a)

    # return list(query_filter - results_filter)
    while query in array: 
        array.remove(query)
    while '' in array:
        array.remove('')
    return array[:5]

# def get_sentiment(query):
#     sentiment = aylien_client.Sentiment({'text': query})
#     return ("%.2f" % sentiment['polarity_confidence'])


def get_related(query):
    #related = aylien_client.Related({"phrase": query})
    #related = requests.get(
    #temp = [a['phrase'] for a in related['related']]
    temp = []
    return filter_extra(query, temp)


def get_entities(term, query):
    doc = nlp(query)
    results = [ent.text.lstrip().rstrip()
               for ent in doc.ents if ent.label_ in appropriate_entities]
    results = list(set(results))
    return filter_extra(term, results)


def get_summary(title, query):
    sentence_count = 3
    doc = nlp(query)

    occurrences = {}

    def fill_occurrences(word):
        word_lemma = lemma(word)
        count = occurrences.get(word_lemma, 0)
        count += 1
        occurrences[word_lemma] = count

    each_word(doc, fill_occurrences)
    ranked = get_ranked(doc.sents, sentence_count, occurrences)
    return " ".join([x['sentence'].text for x in ranked])

"""
Summary Code
"""
def each_word(words, func):
    for word in words:
        if word.pos_ is "PUNCT":
            continue

        func(word)


def get_ranked(sentences, sentence_count, occurrences):
    # Maintain ranked sentences for easy output
    ranked = []

    # Maintain the lowest score for easy removal
    lowest_score = -1
    lowest = 0

    for sent in sentences:
        # Fill ranked if not at capacity
        if len(ranked) < sentence_count:
            score = get_score(occurrences, sent)

            # Maintain lowest score
            if score < lowest_score or lowest_score is -1:
                lowest = len(ranked) + 1
                lowest_score = score

            ranked.append({'sentence': sent, 'score': score})
            continue

        score = get_score(occurrences, sent)
        # Insert if score is greater
        if score > lowest_score:
            # Maintain chronological order
            for i in range(lowest, len(ranked) - 1):
                ranked[i] = ranked[i + 1]

            ranked[len(ranked) - 1] = {'sentence': sent, 'score': score}

            # Reset lowest_score
            lowest_score = ranked[0]['score']
            lowest = 0
            for i in range(0, len(ranked)):
                if ranked[i]['score'] < lowest_score:
                    lowest = i
                    lowest_score = ranked[i]['score']

    return ranked

def lemma(word):
    return word.lemma_

def get_score(occurrences, sentence):
    class Totaler:

        def __init__(self):
            self.score = 0

        def __call__(self, word):
            self.score += occurrences.get(lemma(word), 0)

        def total(self):
            # Should the score be divided by total words?
            return self.score

    totaler = Totaler()
    each_word(sentence, totaler)
    return totaler.total()
