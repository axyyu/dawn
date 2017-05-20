/**
 * Created by Andrew Wang on 5/16/2017.
 */

// Initialize Firebase
var config = {
    apiKey: "AIzaSyDFAmoDrDmoaKPky_D4OOG8m4It1_ePXLs",
    authDomain: "dawn-45cc6.firebaseapp.com",
    databaseURL: "https://dawn-45cc6.firebaseio.com",
    projectId: "dawn-45cc6",
    storageBucket: "dawn-45cc6.appspot.com",
    messagingSenderId: "333228408907"
};
firebase.initializeApp(config);

var structure = {
    uid:[
        {
            name:"Project1",
            type:"MLA/APA",
            recent:"",
            articles:[
                {
                    title:"",
                    url: "",
                    authors: "",
                    abstract: "",
                    publisher: "",
                    publicationDate: "",
                    mla:"",
                    apa:"",
                    sentiment:"",
                    keywords:"",
                    concepts:"",
                    summary:""
                }
            ]
        }
    ]

};
