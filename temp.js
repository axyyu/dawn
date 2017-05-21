/**
 * Created by Andrew Wang on 5/20/2017.
 */
app.post('/search', function(req, response) {
    req.on("data", function(chunk) {
        var str = '' + chunk;
        var question = str.substring(str.indexOf("=") + 1, str.length);
        question = question.replace(/\+/g, " ");

        coreJournal(question, function(entityArray) {
            console.log("array made");
            if(entityArray || entityArray.length == 0){
                response.send(null);
            }
            var wait = entityArray.length;
            console.log(entityArray);
            entityArray.forEach(function(entry) {
                console.log("entered array");
                getCitationMla(entry.title, entry.publisher, entry.publicationDate.substring(0, 4), entry.authors, function(citation) {
                    console.log("\tgot MLA citation");
                    entry.mla = citation;
                    getCitationApa(entry.title, entry.publisher, entry.publicationDate.substring(0, 4), entry.authors, function(citation) {
                        console.log("\tgot APA citation");
                        entry.apa = citation;
                        languageAnalysis(entry.abstract, function(s, k, c) {
                            console.log("\t\tlanguage analysis");
                            entry.sentiment = s;
                            entry.keywords = k;
                            entry.concepts = c;

                            getSummary(entry.abstract, entry.title, 1, function(s) {
                                console.log("\t\t\tgot summary");
                                entry.summary = s;
                                --wait;
                                if (wait < 0) {
                                    response.send(entityArray);
                                }
                            });
                        });
                    });
                });
            });
        });
    });
});