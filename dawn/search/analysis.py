import requests
import json
import re
from aylienapiclient import textapi
from havenondemand.hodclient import *

haven_client = HODClient("beb65937-16e4-4015-ad44-77a7f4e41e0c", version="v2")
aylien_client = textapi.Client("424a577c", "4658a8a1d5404e30296418287bbb5aa0")


def callback(res, **context):
    return json.dumps(res)

#HAVEN
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

#AYLIEN
def get_sentiment(query):
    sentiment = aylien_client.Sentiment({'text': query})
    return sentiment

def get_related(query):
    related = aylien_client.Related({"phrase": query})
    return related

def get_entities(query):
    entities = aylien_client.Entities({"text": query})
    return entities

def get_concepts(query):
    concepts = aylien_client.Concepts({"text": query})
    return concepts

def get_summary(query):
    summary = aylien_client.Summarize({'url': query, 'sentences_number': 2})
    return summary