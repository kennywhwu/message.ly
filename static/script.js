const BASE_URL = 'http://localhost:3001';

$(document).ready(function() {
  console.log('JS ran');

  $('#register-form').on('submit', function(event) {
    console.log('register submit ran');
    event.preventDefault();
    let registerObj = {
      username: $('#username').val(),
      password: $('#password').val(),
      firstName: $('#first-name').val(),
      lastName: $('#last-name').val(),
      phone: $('#phone').val()
    };
    console.log('userRegisterObj ', registerObj);
    $.post(`${BASE_URL}/auth/register`, registerObj, res => {
      console.log('register form posted');
      localStorage.setItem('token', res.token);
    });
  });

  $('#login-form').on('submit', function(event) {
    console.log('login submit ran');
    event.preventDefault();
    let loginObj = {
      username: $('#username').val(),
      password: $('#password').val()
    };
    console.log('userLoginObj ', loginObj);
    $.post(`${BASE_URL}/auth/login`, loginObj, res => {
      console.log('login form posted');
      localStorage.setItem('token', res.token);
    });
  });
});
