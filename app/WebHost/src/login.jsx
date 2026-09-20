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

function doLogin(){
    const form = document.getElementById("login-form");
    const formData = new FormData(form);

    let data = {
        username: formData.get("uname"),
        password: formData.get("psw"),
    };

    console.log(data);
    console.log(data.username);
    console.log(data.password);

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