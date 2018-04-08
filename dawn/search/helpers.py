import requests
import json
import re
import wikipedia as wp
import concurrent.futures

from . import sources

def filter_article(string):
    if string is None:
        return ''
    string = re.sub(r'<(?:.|\n)*?>', '', string)
    return string


def get_definition(query):
    try:
        output = wp.summary(query, sentences=2)
        return output
    except wp.exceptions.DisambiguationError as de:
        for o in de.options:
            print(o)
            if o.lower() != query:
                return wp.summary(o, sentences=2)
        return None
    except wp.exceptions.PageError as pe:
        return None
        '''for o in e.options:
            results = wp.search(o)
            print(o)
            #print(results)
            if len(results) != 0:
                print(results)
                if results[0] == o:
                    summary = wp.summary(results[1], sentences=1)
                    print(summary)
                    return summary
                else:
                    summary = wp.summary(results[0], sentences=1)
                    print(summary)
                    return summary
            #if len(results) != 0: #and o.lower() != query.lower():
                #return wp.summary(results[0], sentences=1)
        '''    

def build_data(source, question):
    source.get_response(question)
    source.parse_data()
    return source.data

def get_data(question, dbs):
    entity_array = []
    threshold = 1
    source_array = []
    for d in dbs:
        if d == "Nature":
            source_array.append(sources.NatureJournal(threshold))
        elif d == "ScienceDirect":
            source_array.append(sources.ScienceDirect(threshold))
        elif d == "Wikipedia":
            source_array.append(sources.Wikipedia(threshold))
        elif d == "CORE":
            source_array.append(sources.COREJournal(threshold))

    with concurrent.futures.ThreadPoolExecutor(max_workers=len(source_array)) as executor:
        future_to_data = {
            executor.submit(
                build_data,
                s,
                question): s for s in source_array}
        for future in concurrent.futures.as_completed(future_to_data):
            entity_array.extend(future.result())
    return entity_array
