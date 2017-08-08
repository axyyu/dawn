var $ = require('jquery');
var request = require('request');
var express = require('express');
var http = require('http');
var fs = require('fs');

var RateLimit = require('express-rate-limit');

var crypto = require('crypto');
var admin = require("firebase-admin");
var database;

var NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js');
var AYLIENTextAPI = require('aylien_textapi');
var havenondemand = require("havenondemand");
var data, config;
var bluemix, aylien_key, aylien_app_id, dictionary_key, CORE_key, DIFF_key, ebib_key, scopus_key, haven_key;
var port;

try {
    data = fs.readFileSync('./config.json', 'utf8');
    config = JSON.parse(data);
    port = config['port'];
    bluemix = config['bluemix'];
    aylien_key = config['aylien_key'];
    aylien_app_id = config['aylien_app_id'];
    dictionary_key = config['dictionary_key'];
    CORE_key = config['CORE_key'];
    DIFF_key = config['DIFF_key'];
    ebib_key = config['ebib_key'];
    scopus_key = config['scopus_key'];
    haven_key = config['haven_key'];
} catch (err) {
    throw err;
}

/*GLOBAL*/
var ARTICLE_COUNT = 3;
var KEYWORD_COUNT = 2;

/*Setup*/
var app = express();
app.enable('trust proxy');

app.set('port', (process.env.PORT || port));
app.use(express.static(__dirname + '/public'));

var searchLimiter = new RateLimit({
    windowMs: 60*60*1000,
    max: 1000,
    delayMs: 0
});
var defineLimiter = new RateLimit({
    windowMs: 60*60*1000,
    max: 100,
    delayMs: 0
});

/*Firebase Setup*/
admin.initializeApp({
    credential: admin.credential.cert("dawn-fb.json"),
    databaseURL: "https://dawn-45cc6.firebaseio.com"
});
database = admin.database();
var ref = database.ref("cache/");

/*API Setup*/
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

/*Retriving Articles*/
function natureJournal(question, callback) {
    request("http://www.nature.com/opensearch/request?query=" + question + "&httpAccept=application/json&maximumRecords=" + ARTICLE_COUNT, function(error, resp, body) {
        if (!error && resp.statusCode == 200) {
            var entityArray = [];
            body = JSON.parse(body);
            if(body == null || body.feed == null || body.feed.entry == null){

            }
            else {
                for (a = 0; a < body.feed.entry.length; a++) {
                    entityArray.push({
                        "title": body.feed.entry[a].title,
                        "url": body.feed.entry[a].link,
                        "abstract": filterArticle(body.feed.entry[a]['sru:recordData']['pam:message']['pam:article']['xhtml:head']['dc:description']),
                        "authors": body.feed.entry[a]['sru:recordData']['pam:message']['pam:article']['xhtml:head']['dc:creator'],
                        "publisher": body.feed.entry[a]['sru:recordData']['pam:message']['pam:article']['xhtml:head']['dc:publisher'],
                        "publicationDate": body.feed.entry[a]['sru:recordData']['pam:message']['pam:article']['xhtml:head']['prism:publicationDate'],
                        "journal": "Nature"
                    });
                }
            }
            callback(entityArray);
        } else {
            console.log(error);
            callback(null);
        }
    });
}
function coreJournal(question, callback) {
    request("https://core.ac.uk:443/api-v2/search/" + question + "?page=1&pageSize=" + 10 + "&apiKey=" + CORE_key, function(error, resp, body) {
        if (!error && resp.statusCode == 200) {
            body = JSON.parse(body);
            var articles = [];
            var len = ARTICLE_COUNT;
            if(ARTICLE_COUNT>body.data.length){
                len=body.data.length;
            }
            for (a = 0; a < len; a++) {
                articles.push(body.data[a].id);
            }
            var length = articles.length;
            entityArray = [];
            articles.forEach(function(idd){
                coreJournalUrls(idd, function(art) {
                    entityArray.push(art);
                    if(entityArray.length==length){
                        return entityArray;
                    }
                });
            });

        } else {
            console.log(error);
            callback(null);
        }
    });
}
function coreJournalUrls(idd, callback) {
    request("https://core.ac.uk:443/api-v2/articles/get/"+ idd + "?urls=true&apiKey=" + CORE_key, function(error, resp, body) {
        if (!error && resp.statusCode == 200) {
            body = JSON.parse(body);
            var articles = [];
            var len = ARTICLE_COUNT;
            if(ARTICLE_COUNT>body.data.length){
                len=body.data.length;
            }
            for (a = 0; a < len; a++) {
                articles.push(body.data[a].id);
            }
            var length = articles.length;
            entityArray = [];

            console.log(articles);
            articles.forEach(function(idd){
                coreJournalUrls(idd, function(art) {
                    entityArray.push(art);
                    if(entityArray.length==length){
                        return entityArray;
                    }
                });
            });

        } else {
            console.log(error);
            callback(null);
        }
    });
}

/*Retrieving Article Data*/
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
function languageAnalysis(text, callback) {
    natural_language_understanding.analyze({
        'text': text,
        'features': {
            'sentiment': {
                'limit': KEYWORD_COUNT
            },
            'keywords': {
                'limit': KEYWORD_COUNT
            },
            'concepts': {
                'limit': KEYWORD_COUNT
            }
        }
    }, function(err, res) {
        if (!err) {
            var s = [];
            var k = [];
            var c = [];
            if(res.keywords != null) {
                for (a = 0; a < res.keywords.length; a++) {
                    k.push(res.keywords[a].text);
                }
            }
            if(res.concepts != null) {
                s.push(res.sentiment.document.score);
                for (a = 0; a < res.concepts.length; a++) {
                    c.push(res.concepts[a].text);
                }
            }
            callback(s, k, c);
        } else {
            console.log(err);
            callback(null, null, null);
        }
    });
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
function getCitationMla(title, publisher, publicationYear, authors, callback) {
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
function getCitationApa(title, publisher, publicationYear, authors, callback) {
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
            "style": "apa",
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


/*Retrive Other Data*/
function defineWord(text, callback){
    request({
        url: "http://www.dictionaryapi.com/api/v1/references/collegiate/xml/"+text+"?key="+dictionary_key,
        method: "POST"
    }, function(error, res, data) {
        if (!error && res.statusCode === 200) {
            callback(data);
        } else {
            console.log(error);
            callback(null);
        }
    });
}
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
function filterArticle(str){
    if(str==null){
        return "";
    }
    return str.replace(/<(?:.|\n)*?>/gm, '');
}

app.post('/define', defineLimiter, function(req, response) {
    req.on("data", function(chunk) {
        var str = '' + chunk;
        var word = str.substring(str.indexOf("=") + 1, str.length);
        word = word.replace(/\+/g, " ");
        defineWord(word, function(def){
            console.log("got definition");
            response.send(def);
        });
    });
});

app.post('/search', searchLimiter, function(req, response) {
    req.on("data", function(chunk) {
        var str = '' + chunk;
        var question = str.substring(str.indexOf("=") + 1, str.length);
        question = question.replace(/\+/g, " ");
        var hash = crypto.createHash('md5').update(question).digest("hex");

        ref.child(hash).once("value", function(snapshot) {
            var ent = snapshot.val();
            if(ent !== null){
                response.send(ent);
            }
            else{
                natureJournal(question, function(entityArray) {
                    // console.log("array made");
                    var wait = entityArray.length;
                    if(wait==0){
                        response.send(entityArray);
                    }
                    entityArray.forEach(function(entry) {
                        // console.log("entered array");
                        getCitationMla(entry.title, entry.publisher, entry.publicationDate.substring(0, 4), entry.authors, function(citation) {
                            // console.log("\tgot MLA citation");
                            entry.mla = citation;
                            getCitationApa(entry.title, entry.publisher, entry.publicationDate.substring(0, 4), entry.authors, function(citation) {
                                // console.log("\tgot APA citation");
                                entry.apa = citation;
                                entry.abstract = filterArticle(entry.abstract);
                                if( entry.abstract ==null || entry.abstract==""){
                                    --wait;
                                }
                                else{
                                    languageAnalysis(entry.abstract, function(s, k, c) {
                                        // console.log("\t\tlanguage analysis");
                                        entry.sentiment = s;
                                        entry.keywords = k;
                                        entry.concepts = c;

                                        getSummary(entry.abstract, entry.title, 1, function(s) {
                                            // console.log("\t\t\tgot summary");
                                            entry.summary = s;
                                            --wait;
                                            if (wait == 0) {
                                                ref.child(hash).set(entityArray);
                                                response.send(entityArray);
                                            }
                                        });
                                    });
                                }
                            });
                        });
                    });
                });
            }
        });
    });
});

//Runs app
app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});
