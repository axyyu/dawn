from abc import ABC, abstractmethod
import re

class Source(ABC):

    @abstractmethod
    def obtain_articles(query, entry_num):
        pass

    @abstractmethod
    def parse_response(res):
        pass