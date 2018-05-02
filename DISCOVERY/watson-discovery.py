import requests

credentials = {
  "url": "https://gateway.watsonplatform.net/discovery/api",
  "username": "7c1efdd1-7271-4ac5-bd63-29e7e4cb5630",
  "password": "xQKVD1VBVTkq"
}

class WatsonDiscovery:

    def __init__(self):
        self.session = requests.Session()
        self.session.auth = (credentials.username, credentials.password)
        self.session.headers = {
            "Content-Type":"application/json"
        }


    ################################################################
    #           Environment
    ################################################################
    
    def create_environment(self, name="my-environment", desc="my-description"):
        res = self.session.post(
            "https://gateway.watsonplatform.net/discovery/api/v1/environments?version=2017-11-07",
            data = { "name":name, "description":desc}
        )
        res.raise_for_status()
        return res.json()

    def environment_status(self, env_id):
        res = self.session.get(
            "https://gateway.watsonplatform.net/discovery/api/v1/environments/{}?version=2017-11-07".format(env_id)
        )
        res.raise_for_status()
        return res.json()

    ################################################################
    #           Collection
    ################################################################

    def get_default_configuration(self, env_id):
        res = self.session.get(
            "https://gateway.watsonplatform.net/discovery/api/v1/environments/{}/configurations?version=2017-11-07".format(env_id)
        )
        res.raise_for_status()
        return res.json()

    def create_collection(self, env_id, config_id):
        res = self.session.post(
            "https://gateway.watsonplatform.net/discovery/api/v1/environments/{}/collections?version=2017-11-07".format(env_id),
            data = {
                "name": "my-first-collection", 
                "description": "exploring collections", 
                "configuration_id": config_id , 
                "language": "en_us"
                }
        )
        res.raise_for_status()
        return res.json()

    def collection_status(self, env_id, collect_id):
        res = self.session.get(
            "https://gateway.watsonplatform.net/discovery/api/v1/environments/{}/collections/{}?version=2017-11-07".format(env_id, collect_id)
        )
        res.raise_for_status()
        return res.json()

    ################################################################
    #           Documents
    ################################################################
    
    def 