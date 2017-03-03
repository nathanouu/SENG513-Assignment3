/*
    Name:             Hannah Wright
    ID:               10171450
    Tutorial Section: B02
*/

/******************** SOURCE INFORMATION FOR CLIENT *********************/
/* To start, I copied the example chat program provided as a base program.
/* For both the client and the server, I used the following as references:
/*    http://www.tamas.io/simple-chat-application-using-node-js-and-socket-io/
/*    http://www.tamas.io/advanced-chat-using-node-js-and-socket-io-episode-1/
/***********************************************************************/

$(function() {
  var socket = io.connect('http://127.0.0.1:3000');

  let $input = $('#msg-box');
  let $window = $(window);
  let $messages = $('#messages');
  let $current_username = $('#current-user');
  let $current_online_users = $('#online-users');

  $input.keypress(function(e) {
    if (e.keyCode === 13) {
      e.preventDefault();
      socket.emit('chat', $input.val());
      $input.val('');
    }
  });

  socket.on('connect', function (data) {
    var user = getCookie("username");
    if (user != "") {
      var user_colour = getCookie("colour");
      socket.emit("returning-user", {username: user, colour: user_colour});
    } else {
      socket.emit("new-user");
    }
  });

  socket.on('alert', function(response) {
    let formatted = "<li class='message alert'>" + response + "</li>";
    $messages.append(formatted);
    scroll_down();
  });

  socket.on('set-cookie', function(response){
    client_username = response.username;
    client_colour = response.colour;
    setCookie("username", client_username, 1);
    setCookie("colour", client_colour, 1);
  });

  socket.on('get-history', function(response){
    let history = response;
    $.each(history, function(index, value) {
      let message_html = display_message(value);
      $messages.append(message_html);
    });
    scroll_down();
  });

  socket.on('update', function(response){
    let client_username = response.username;
    let client_colour = response.colour;
    setCookie("username", client_username, 1);
    setCookie("colour", client_colour, 1);

    if(response.colour != "default")
      $current_username.html("You are <font color='" + client_colour + "'>" + client_username + "</font>");
    else
      $current_username.html("You are " + client_username);
  });

  socket.on('update-people', function(response){
    online_users = response;
    $current_online_users.empty();
    console.log(online_users);
    $.each(online_users, function(index, value) {
      let formatted = "<li><div class='fa fa-user'></div><div class='user'>";
      if(value.colour != "default")
        formatted += "<font color='" + value.colour + "'>" + value.username + "</font>"
      else
        formatted += value.username;

      $current_online_users.append(formatted + "</div></li>");
    });
  });

  socket.on('chat', function(response){
    let message_html = display_message(response);
    $messages.append(message_html);
    scroll_down();
  });


  function display_message(message_data) {
    let messsage_type;
    if (message_data.user.username === getCookie("username"))
      message_type = "self";
    else
      message_type = "other";

    let formatted = "<li class='message " + message_type + "'><name>";
    if(message_data.user.colour != "default")
      formatted += "<font color='" + message_data.user.colour + "'>" + message_data.user.username + "</font>"
    else
      formatted += message_data.user.username;
    formatted += "</name><time>" + message_data.server_time + "</time><p> " + message_data.message + "</p></li>";
    return formatted;
  }

  function scroll_down() {
    let chat_div = document.getElementById("messages");
    chat_div.scrollTop = chat_div.scrollHeight;
  }

  /* Stolen from: https://www.w3schools.com/js/js_cookies.asp */
  function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
  }

  function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == ' ')
        c = c.substring(1);

      if (c.indexOf(name) == 0)
        return c.substring(name.length, c.length);

    }
    return "";
  }
});
