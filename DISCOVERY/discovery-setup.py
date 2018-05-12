from watson_developer_cloud import DiscoveryV1
import json
import requests
import os

topic_list = [
    ""
]

credentials = {
    "url": "https://gateway.watsonplatform.net/discovery/api",
    "username": "7c1efdd1-7271-4ac5-bd63-29e7e4cb5630",
    "password": "xQKVD1VBVTkq",
    "environment_id": "e572d56e-39f7-44d3-b0a2-4c39b638b006",
    "configuration_id":"3ad677b1-ac3b-4a0d-a344-61bb0cf254bc",
    "collection_id":"012a878b-d7d4-4e34-83f4-1614bca4b3d7",
    "document_id":"91160791-821c-42a8-9f26-918c6c682c57"
}

discovery = DiscoveryV1(
    version= "2018-03-05",
    username= credentials['username'],
    password= credentials['password']
)

question = "chicken"
threshold = 50
r = requests.get(
        'http://www.nature.com/opensearch/request?query=' +
        question +
        '&httpAccept=application/json&sortKeys=publicationDate,pam,0&maximumRecords=' +
        str(threshold)
    ).json()
if r is not None and 'feed' in r:
    if 'entry' in r['feed']:
        entries = r['feed']['entry']
        for result in entries:
            item = {}
            item['title'] = result['title'].replace('"', '').replace('\'', '')
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

            try:
                with open("documents/{}.json".format(item['title']),"w+") as f:
                    f.write(json.dumps(item))

                with open("documents/{}.json".format(item['title']),"r") as f:
                    add_doc = discovery.add_document(credentials['environment_id'], credentials['collection_id'], file=f)
                
                os.remove("documents/{}.json".format(item['title']))
            except Exception:
                print(item['title'])
                            


# print(json.dumps(add_doc, indent=2))

# doc_info = discovery.get_document_status(credentials['environment_id'], credentials['collection_id'], credentials['document_id'])
# print(json.dumps(doc_info, indent=2))

# collection = discovery.get_collection(credentials['environment_id'], credentials['collection_id'])
# print(json.dumps(collection, indent=2))

my_query = discovery.query(
    environment_id=credentials['environment_id'], 
    collection_id=credentials['collection_id'], 
    query="chicken")
print(json.dumps(my_query, indent=2))