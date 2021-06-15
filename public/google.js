'use strict';
function signOut() {
  let auth2 = gapi.auth2.getAuthInstance();
  auth2.signOut().then(function () {
    console.log('User signed out.');
  });
}
function onSignIn(googleUser) {
  let id_token = googleUser.getAuthResponse().id_token;
  let xhr = new XMLHttpRequest();
  xhr.open('POST', '/login');
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.onload = function () {
    // console.log('Signed in as: ' + xhr.responseText);
    if (xhr.responseText === 'success') {
      // signOut();
      location.assign('/profile');
    }
  };
  xhr.send(JSON.stringify({ token: id_token }));
}
