/**
 * Created by Andrew Wang on 5/15/2017.
 */

$(document).ready(function () {
    $(".login-tab").click(function(){
        $(".login-tab").removeClass("selected");
        $(this).addClass("selected");
        $(".login-bars").hide();
        $(".error").hide();
        $("#"+$.trim($(this).text())).fadeIn();
    });
    $("#logo-icon").click(function(){
        window.location = 'index.html';
    });

    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            window.location = 'index.html';
        } else {
            // User is signed out.
            // ...
        }
    });
});

function register(){
    $("#register").hide();
    $("#loading-view").fadeIn("fast");
    var email = $("#register-email").val();
    var password = $("#register-pass").val();
    firebase.auth().createUserWithEmailAndPassword(email, password).catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log(errorCode);
        var errordisplay = $("#register-error");
        if (errorCode == 'auth/weak-password') {
            errordisplay.text('Please try using a stronger password.');
        }
        else if (errorCode == 'auth/invalid-email') {
            errordisplay.text('Please enter a proper email.');
        }
        else if (errorCode == 'auth/email-already-in-use') {
            errordisplay.text('This email belongs to an account.');
        }
        else {
            errordisplay.text("Sorry, there was an error. Please try again later.");
        }
        $("#loading-view").hide();
        $("#register").fadeIn("fast");
    });
}
function login(){
    $("#login").hide();
    $("#loading-view").fadeIn("fast");
    var email = $("#login-email").val();
    var password = $("#login-pass").val();
    firebase.auth().signInWithEmailAndPassword(email, password).catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log(errorCode);
        var errordisplay = $("#register-error");
        if (errorCode == 'auth/invalid-email') {
            errordisplay.text('Please enter a proper email.');
        }
        else if (errorCode == 'auth/user-disabled') {
            errordisplay.text('Your account has been disabled.');
        }
        else if (errorCode == 'auth/user-not-found') {
            errordisplay.text('This account does not exist.');
        }
        else if (errorCode == 'auth/wrong-password') {
            errordisplay.text('This account does not exist.');
        }
        else {
            errordisplay.text("Sorry, there was an error. Please try again later.");
        }
        $("#loading-view").hide();
        $("#register").fadeIn("fast");
    });
}