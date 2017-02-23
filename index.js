// http://www.tamas.io/simple-chat-application-using-node-js-and-socket-io/

var express = require('express');
var cookieParser = require('cookie-parser');
var dateFormat = require('dateformat');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;

let online_users = {};
let chat_history = [];

http.listen( port, function () {
	console.log('Listening on port', port);
});

app.use(express.static(__dirname + '/public'));

// listen to 'chat' messages
io.on('connection', function(client){
		client.on('new-user', function(){
				let name = "Anonymous" + Math.floor((Math.random() * 100) + 1);
				while(!unique_username(name)) // prevent duplicate usernames
					name = "Anonymous" + Math.floor((Math.random() * 100) + 1);
				online_users[client.id] = {username: name, colour: "default"};
				user_joined();
		});

		client.on('returning-user', function(response) {
				let old_name = response.username;
				let old_colour = response.colour;
				online_users[client.id] = {username: old_name, colour: old_colour};
				user_joined();
		});

		function user_joined() {
				client.emit('get-history', chat_history);
				client.emit('update', online_users[client.id]);
				client.emit('set-cookie', online_users[client.id]);

				io.emit('update-people', online_users);
				io.emit('alert', online_users[client.id].username + " joined the conversation.");
				console.log(online_users[client.id].username + " connected.");
		}

		client.on('chat', function(data){
				let now = new  Date();
				let colour_val = "default";

				// https://obviate.io/2015/07/23/socketio-irc-style-tutorial-part-4-the-client-code/
				let nick_test = /^\/nick ([a-zA-Z0-9]{0,20})/g;
				let nick_request = nick_test.exec(data);
				let colour_test = /^\/nickcolor ([0-9a-fA-F]{6})/g;
				let colour_request = colour_test.exec(data);

				if(nick_request != null) {
						let new_username = nick_request[1];
						let old_username = online_users[client.id].username;
						if(!unique_username(new_username))
								client.emit('alert', "The nickname " + new_username + " is already taken.");
						else {
								online_users[client.id] = {username: new_username, colour: "default"};
								update_users();
								io.emit('alert', old_username + " changed their nickname to " + new_username + ".");
						}
				} else if (colour_request != null) {
						online_users[client.id].colour = colour_request[1];
						update_users();
						client.emit('alert', "Colors successfully changed.");
				} else {
						let message_data = { message: data,
													 		   user: online_users[client.id],
																 // http://stackoverflow.com/questions/3552461/
																 server_time: dateFormat(now, "mmmm dS, yyyy - h:MM TT")};
				if(chat_history.length >= 200) // only store the last 200 messages
						chat_history.splice(0,1);
						chat_history.push(message_data);
						io.emit('chat', message_data);
		}});

		client.on('disconnect', function() {
				if(online_users[client.id] != null) {
						let old_username = online_users[client.id].username;
						io.emit('alert', old_username + " left the conversation.");
						console.log(old_username + " disconnected");
				}
				delete online_users[client.id];
				io.emit('update-people', online_users);
		});

		function update_users() {
				client.emit('update', online_users[client.id]);
				io.emit('update-people', online_users);
		}

		function unique_username(name) {
				let unique = true;
				for(let property in online_users) {
						if(!unique) break;
						if(online_users[property] == name)
							unique = false;
				}
				return unique;
		}
});
