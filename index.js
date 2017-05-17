var $ = require('jquery');
var request = require('request');
var express = require('express');
var http = require('http');
var fs = require('fs');
var Bing = require('node-bing-api');
var NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js');
var AYLIENTextAPI = require('aylien_textapi');
var havenondemand = require("havenondemand");
var data, config;
var bluemix, aylien_key, aylien_app_id, bing_key1, bing_key2, CORE_key, DIFF_key, ebib_key, scopus_key, haven_key;
var port;

try {
    data = fs.readFileSync('./config.json', 'utf8');
    config = JSON.parse(data);
    port = config['port'];
    bluemix = config['bluemix'];
    aylien_key = config['aylien_key'];
    aylien_app_id = config['aylien_app_id'];
    bing_key1 = config['bing_key1'];
    bing_key2 = config['bing_key2'];
    CORE_key = config['CORE_key'];
    DIFF_key = config['DIFF_key'];
    ebib_key = config['ebib_key'];
    scopus_key = config['scopus_key'];
    haven_key = config['haven_key'];
} catch (err) {
    throw err;
}

/*Setup*/
var app = express();

app.set('port', (process.env.PORT || port));
app.use(express.static(__dirname + '/public'));

/*API Setup*/
var BingWebSearch = Bing({
    accKey: bing_key1
});
var natural_language_understanding = new NaturalLanguageUnderstandingV1({
    'username': bluemix.username,
    'password': bluemix.password,
    'version_date': '2017-02-27'
});
var textapi = new AYLIENTextAPI({
    application_id: aylien_app_id,
    application_key: aylien_key
});
var havenapi = new havenondemand.HODClient(haven_key, 'v1');

/*Retrieving Data*/
function relatedConcepts(text, callback) {
    havenapi.post('findrelatedconcepts', {
        'text': text,
        'max_results': 15,
        'sample_size': 2500
    }, true, function(err, res) {
        if (!err) {
            callback(res.entities);
        } else {
            console.log(err);
            callback(null);
        }
    })
}

function getSummary(text, title, length, callback) {
    textapi.summarize({
        text: text,
        title: title,
        sentences_number: length
    }, function(error, res) {
        if (error === null) {
            callback(res.sentences);
        } else {
            console.log(error);
            callback(null);
        }
    });
}

function languageAnalysis(text, callback) {
    natural_language_understanding.analyze({
        'text': text,
        'features': {
            'sentiment': {
                'limit': 5
            },
            'keywords': {
                'limit': 5
            },
            'concepts': {
                'limit': 3
            }
        }
    }, function(err, res) {
        if (!err) {
            var s = [];
            var k = [];
            var c = [];
            for (a = 0; a < res.keywords.length; a++) {
                k.push(res.keywords[a].text);
            }
            s.push(res.sentiment.document.score);
            for (a = 0; a < res.concepts.length; a++) {
                c.push(res.concepts[a].text);
            }
            callback(s, k, c);
        } else {
            console.log(err);
            callback(null, null, null);
        }
    });
}

function createMap(depth, responseArr, responseNum, text) {
    if (depth == 0) {

    } else {

    }
}

function getCitation(title, publisher, publicationYear, authors, callback) {
    var autho = [];
    if (authors != null && authors != 'null' && authors[0] != 'null') {
        for (c = 0; c < authors.length; c++) {
            autho.push({
                "function": "author",
                "first": authors[c].substring(0, authors[c].indexOf(" ")),
                "middle": authors[c].substring(authors[c].indexOf(" "), authors[c].lastIndexOf(" ")),
                "last": authors[c].substring(authors[c].lastIndexOf(" "))
            });
        }
    } else {
        autho.push({});
    }
    request({
        url: "https://api.citation-api.com/2.1/rest/cite",
        method: "POST",
        json: {
            "key": ebib_key,
            "source": "journal",
            "style": "mla7",
            "journal": {
                "title": title
            },
            "pubtype": {
                "main": "pubjournal"
            },
            "pubjournal": {
                "title": publisher,
                "year": publicationYear
            },
            "contributors": autho
        }
    }, function(error, res, info) {
        if (!error && res.statusCode === 200) {
            callback(info.data);
        } else {
            console.log(error);
            callback(null);
        }
    });
}

function natureJournal(question, length, callback) {
    request("http://www.nature.com/opensearch/request?query=" + question + "&httpAccept=application/json&maximumRecords=" + length, function(error, resp, body) {
        if (!error && resp.statusCode == 200) {
            var entityArray = [];
            body = JSON.parse(body);
            for (a = 0; a < body.feed.entry.length; a++) {
                entityArray.push({
                    "title": body.feed.entry[a].title,
                    "url": body.feed.entry[a].link,
                    "abstract": body.feed.entry[a]['sru:recordData']['pam:message']['pam:article']['xhtml:head']['dc:description'],
                    "authors": body.feed.entry[a]['sru:recordData']['pam:message']['pam:article']['xhtml:head']['dc:creator'],
                    "publisher": body.feed.entry[a]['sru:recordData']['pam:message']['pam:article']['xhtml:head']['dc:publisher'],
                    "publicationDate": body.feed.entry[a]['sru:recordData']['pam:message']['pam:article']['xhtml:head']['prism:publicationDate']
                });
            }
            callback(entityArray);
        } else {
            console.log(error);
            callback(null);
        }
    });
}

function bingResults() {

}

function coreJournalUrls(urlarray, callback) {
    request({
        url: "https://api.citation-api.com/2.1/rest/cite",
        method: "POST",
        json: {
            "body": urlarray,
            "apiKey": CORE_key
        }
    }, function(error, res, body) {
        if (!error && res.statusCode === 200) {
            var entityArray = [];
            var length = body.length;

            for (a = 0; a < body.length; a++) {
                var auth = [];
                for (b = 0; b < body[a].data.authors.length; b++) {
                    auth.push(body[a].data.authors[b].substring(body[a].data.authors[b].indexOf(",") + 2, body[a].data.authors[b].length) + " " + body[a].data.authors[b].substring(0, body[a].data.authors[b].indexOf(",")))
                }
                getFullArticle("core.ac.uk/display/" + body[a].data.id, function(text) {
                    entityArray.push({
                        "title": body[a].data.title,
                        "url": "core.ac.uk/display/" + body[a].data.id,
                        "authors": auth,
                        "abstract": text,
                        "publisher": body[a].data.publisher,
                        "publicationDate": body[a].data.datePublished
                    });
                    --length;
                    if (length <= 0) {
                        callback(entityArray);
                    }
                });
            }
        } else {
            console.log(error);
            callback(null);
        }
    });
}

function coreJournal(question, length, callback) {
    request("https://core.ac.uk:443/api-v2/search/" + question + "?page=1&pageSize=" + length + "&apiKey=" + CORE_key, function(error, resp, body) {
        if (!error && resp.statusCode == 200) {
            body = JSON.parse(body);
            var articles = [];
            for (a = 0; a < body.data.length; a++) {
                articles.push(body.data[a].id);
            }

            coreJournalUrls(articles, function(entityArray) {
                callback(entityArray);
            });
        } else {
            console.log(error);
            callback(null);
        }
    });
}

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


/*Helper Functions*/
function xmlToJson(xml) {

    // Create the return object
    var obj = {};

    if (xml.nodeType == 1) { // element
        // do attributes
        if (xml.attributes.length > 0) {
            obj["@attributes"] = {};
            for (var j = 0; j < xml.attributes.length; j++) {
                var attribute = xml.attributes.item(j);
                obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
            }
        }
    } else if (xml.nodeType == 3) { // text
        obj = xml.nodeValue;
    }

    // do children
    if (xml.hasChildNodes()) {
        for (var i = 0; i < xml.childNodes.length; i++) {
            var item = xml.childNodes.item(i);
            var nodeName = item.nodeName;
            if (typeof(obj[nodeName]) == "undefined") {
                obj[nodeName] = xmlToJson(item);
            } else {
                if (typeof(obj[nodeName].push) == "undefined") {
                    var old = obj[nodeName];
                    obj[nodeName] = [];
                    obj[nodeName].push(old);
                }
                obj[nodeName].push(xmlToJson(item));
            }
        }
    }
    return obj;
}

app.post('/fetch', function(req, response) {
    req.on("data", function(chunk) {
        // console.log("diffbot");
        // var str = ''+chunk;
        // var article = str.substring(str.indexOf("=")+1,str.length);
        //
        // request("https://api.diffbot.com/v3/article?token="+DIFF_key+"&url="+article,function (error, resp, body) {
        //     if (!error && resp.statusCode == 200) {
        //         console.log("diffbot");
        //         var body = JSON.parse(body);
        //         response.send(body);
        //     }
        // });
        var str = '' + chunk;
        var title = str.substring(str.indexOf("=") + 1, str.length);
        var article = str.substring(str.lastIndexOf("=") + 1, str.length);


    });
});

app.post('/search', function(req, response) {
    req.on("data", function(chunk) {
        var str = '' + chunk;
        var question = str.substring(str.indexOf("=") + 1, str.length);
        question = question.replace(/\+/g, " ");

        natureJournal(question, 10, function(entityArray) {
            console.log("array made");
            var wait = entityArray.length;
            if (wait == 0) {
                response.send(entityArray);
            }
            entityArray.forEach(function(entry) {
                console.log("entered array");
                getCitation(entry.title, entry.publisher, entry.publicationDate.substring(0, 4), entry.authors, function(citation) {
                    console.log("\tgot citation");
                    entry.bibliography = citation;
                    languageAnalysis(entry.abstract, function(s, k, c) {
                        console.log("\t\tlanguage analysis");
                        entry.sentiment = s;
                        entry.keywords = k;
                        entry.concepts = c;

                        getSummary(entry.abstract, entry.title, 1, function(s) {
                            console.log("\t\t\tgot summary");
                            entry.summary = s;
                            --wait;
                            if (wait <= 0) {
                                response.send(entityArray);
                            }
                        });
                    });
                });
            });
        });
    });
});

//Runs app
app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});