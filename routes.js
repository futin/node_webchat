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
            mongodb.getUsersFromRoom(data, function (err, result) {
                if (err) {
                    console.log(err);
                    return;
                }
                if (result.length === 0) {
                    socket.emit('peopleinchat', {number: 0});
                }else {
                    socket.emit('peopleinchat', {
                        number: result.length,
                        name: result[result.length - 1].name,
                        email: result[result.length - 1].email,
                        roomName: result[result.length - 1].roomName,
                        roomId: result[result.length - 1].roomId
                    });
                }
            });
        });

        // When the client emits 'login', save his name and avatar,
        // and add them to the room
        socket.on('login', function (data) {

            // Use the socket object to store data. Each client gets
            // their own unique socket object
            socket.name = data.name;
            socket.roomId = data.roomId;
            socket.email = gravatar.url(data.email, {s: '140', r: 'x', d: 'mm'});
            socket.roomName = data.roomName;

            // Tell the person what he should use for an avatar
            socket.emit('img', socket.email);

            // Add the client to the room
            socket.join(data.roomId);

            //let everybody know that you are in the room
            socket.broadcast.to(this.roomId).emit('joined', {
                emitted: true,
                roomId: this.roomId,
                name: this.name,
                email: this.email
            });

            //add user to database
            var user = new User({
                roomId: this.roomId,
                roomName: this.roomName,
                name: this.name,
                email: this.email
            });

            mongodb.saveUser(user, function (err, user) {
                if (err) {
                    console.log(err);
                } else {
                    console.log(user.name + " is saved");
                    mongodb.getUsersFromRoom(data.roomId, function (err, users) {
                        if (err) {
                            console.log(err);
                        } else {
                            var userNames = [],
                                emails = [];
                            for (var i in users) {
                                if (Object.prototype.hasOwnProperty.call(users, i)) {
                                    userNames.push(users[i].name);
                                    emails.push(users[i].email);
                                }
                            }

                            // Send the startChat event to all the people in the
                            // room, along with a list of people that are in it.
                            chat.in(data.roomId).emit('startChat', {
                                emitted: true,
                                roomId: data.roomId,
                                userNames: userNames,
                                emails: emails,
                                roomName: data.roomName
                            });
                        }
                    });
                }
            });
        });

        socket.on('type', function () {
            socket.broadcast.to(this.roomId).emit('isTyping', {
                emitted: true,
                roomId: this.roomId,
                name: this.name,
                email: this.email
            });
        });

        // Somebody left the chat
        socket.on('disconnect', function () {

            // Notify the other person in the chat room
            // that his partner has left
            socket.broadcast.to(this.roomId).emit('leave', {
                emitted: true,
                roomId: this.roomId,
                name: this.name,
                email: this.email
            });

            // leave the room
            socket.leave(socket.roomId);
            mongodb.removeUser(socket.name);
            //Delete room from mongodb if there are no more people inside
            mongodb.getUsersFromRoom(socket.roomId, function(err, result){
               if(err)
                   console.log(err);
               if(result.length === 0){
                   mongodb.removeRoom(socket.roomId);
               }
            });

        });

        // Handle the sending of messages
        socket.on('msg', function (data) {

            // When the server receives a message, it sends it to the other person in the room.
            socket.broadcast.to(socket.roomId).emit('receive', {msg: data.msg, name: data.name, img: data.img});
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





