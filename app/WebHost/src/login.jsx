import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { api_login, api_create_account, getApiStem, _getCookie } from "./main";

window._getCookie = _getCookie;
let token = _getCookie("auth");
console.log(token);
console.log(document.cookie);

if (token != ""){
    //if we have a valid auth token, redirect to '/'
    window.location.href = "/";
}

function getFormData(formName){
    const form = document.getElementById(formName);
    const formData = new FormData(form);

    let data = {
        username: formData.get("uname"),
        password: formData.get("psw"),
        email: formData.get("email")    // undefined if formName is 'login-form'
    };
    return data;
}

function doLogin(){

    let data = getFormData('login-form');

    api_login(data.username, data.password)
    .then(function(success){
        if (success){
            document.location = "/";
        }
        else {
            console.log("Error, invalid login");
        }
    });
}
window.doLogin = doLogin;

function doSignup(){
    let data = getFormData('signup-form');

    api_create_account(data.username, data.email, data.password)
    .then(function(success){
        if (success){
            document.getElementById("signup-success-message").style.display = "initial";
            //document.location = "/";
        }
        else {
            console.log("Error, invalid login");
        }
    });
}
window.doSignup = doSignup;