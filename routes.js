// This file is required by app.js. It sets up event listeners
// for the two main URL endpoints of the application - /create and /chat/:id
// and listens for socket.io messages.

// Use the gravatar module, to turn email addresses into avatar images:

var gravatar = require('gravatar');
var handler = require('./myhandlers/imageHandler');
var mongodb = require('./database/mongoDB');
var User = mongodb.User;

// Export a function, so that we can pass 
// the app and io instances from the app.js file:

module.exports = function (app, io) {
    app.get('/', function (req, res) {

        // Render views/home.html
        res.render('home');
    });

    app.get('/create', function (req, res) {

        // Generate unique id for the room
        var id = Math.round((Math.random() * 1000000));

        // Redirect to the random room
        res.redirect('/chat/' + id);
    });

    app.get('/chat/:id', function (req, res) {

        // Render the chant.html view
        res.render('chat');
    });
    /*
     app.post('/upload', function (req, res, next) {
     handler.upload(req, res, function (err) {
     if (err) {
     console.log(err);
     return;
     } else {

     console.log('upload: ' + req.file.originalname);
     // Render the chant.html view
     res.render('chat');

     res.redirect('/chat/' + 316608);
     }
     });
     });
     */
    // Initialize a new socket.io application, named 'chat'
    var chat = io.on('connection', function (socket) {

        // When the client emits the 'load' event, reply with the
        // number of people in this chat room
        socket.on('load', function (data) {
            var room = findClientsSocket(io, data);
            if (room.length === 0) {
                socket.emit('peopleinchat', {number: 0});
            }
            else {
                socket.emit('peopleinchat', {
                    number: room.length,
                    user: room[room.length - 1].username,
                    avatar: room[room.length - 1].avatar,
                    roomName: room[room.length - 1].roomName,
                    id: data
                });
            }
        });

        // When the client emits 'login', save his name and avatar,
        // and add them to the room
        socket.on('login', function (data) {
            var room = findClientsSocket(io, data.id);

            // Use the socket object to store data. Each client gets
            // their own unique socket object
            socket.username = data.user;
            socket.room = data.id;
            socket.avatar = gravatar.url(data.avatar, {s: '140', r: 'x', d: 'mm'});
            socket.roomName = data.roomName;

            // Tell the person what he should use for an avatar
            socket.emit('img', socket.avatar);

            // Add the client to the room
            socket.join(data.id);

            //let everybody know that you are in the room
            socket.broadcast.to(this.room).emit('joined', {
                boolean: true,
                room: this.room,
                user: this.username,
                avatar: this.avatar
            });

            //add user to database
            var user = new User({
                roomId: this.room,
                name: this.username,
                email: this.avatar
            });

            var usernames = [],
                avatars = [];
            for (var i in room) {
                if (Object.prototype.hasOwnProperty.call(room, i)) {
                    usernames.push(room[i].username);
                    avatars.push(room[i].avatar);
                }
            }

            // Send the startChat event to all the people in the
            // room, along with a list of people that are in it.
            chat.in(data.id).emit('startChat', {
                boolean: true,
                id: data.id,
                users: usernames,
                avatars: avatars,
                roomName: data.roomName
            });
        });

        socket.on('type', function () {
            socket.broadcast.to(this.room).emit('isTyping', {
                boolean: true,
                room: this.room,
                user: this.username,
                avatar: this.avatar
            });
        });

        // Somebody left the chat
        socket.on('disconnect', function () {

            // Notify the other person in the chat room
            // that his partner has left
            socket.broadcast.to(this.room).emit('leave', {
                boolean: true,
                room: this.room,
                user: this.username,
                avatar: this.avatar
            });

            // leave the room
            socket.leave(socket.room);
        });

        // Handle the sending of messages
        socket.on('msg', function (data) {

            // When the server receives a message, it sends it to the other person in the room.
            socket.broadcast.to(socket.room).emit('receive', {msg: data.msg, user: data.user, img: data.img});
        });

        socket.on('test', function (data) {
            console.log(data);
            handler.upload.single('avatarImg'), function (req, res, next) {
                console.log("uploaded");
                console.log(req.file.originalname);

            }
        });
    });
};

function findClientsSocket(io, roomId, namespace) {
    var res = [],
        // the default namespace is "/"
        ns = io.of(namespace || "/");

    if (ns) {
        for (var id in ns.connected) {
            if (roomId) {
                var index = ns.connected[id].rooms.indexOf(roomId);
                if (index !== -1) {
                    res.push(ns.connected[id]);
                }
            }
            else {
                res.push(ns.connected[id]);
            }
        }
    }
    return res;
}




