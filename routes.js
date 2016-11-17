// This file is required by app.js. It sets up event listeners
// for the two main URL endpoints of the application - /create and /chat/:id
// and listens for socket.io messages.

// Use the gravatar module, to turn email addresses into avatar images:

const gravatar = require('gravatar');
//const handler = require('./myhandlers/imageHandler');
const mongodb = require('./database/mongoDB');

// Export a function, so that we can pass 
// the app and io instances from the app.js file:

module.exports = function (app, io) {
    app.get('/', function (req, res) {

        // Render views/home.html
        res.render('home');
    });

    app.get('/create', function (req, res) {

        // Generate unique id for the room
        let id = Math.round((Math.random() * 1000000));

        // Redirect to the random room
        res.redirect('/chat/' + id);
    });

    app.get('/chat/:id', function (req, res) {

        // Render the chant.html view
        res.render('chat');
    });

    // Initialize a new socket.io application, named 'chat'
    let chat = io.on('connection', function (socket) {

        // When the client emits the 'load' event, reply with the
        // number of people in this chat room
        socket.on('load', function (data) {
            mongodb.getUsersFromRoom(data, function (err, result) {
                if (err) {
                    console.log(err);
                    return;
                }
                if (result.length === 0) {
                    socket.emit('peopleInChat', {number: 0});
                } else {
                    socket.emit('peopleInChat', {
                        number: result.length,
                        roomId: result[result.length - 1].roomId,
                        roomName: result[result.length - 1].roomName,
                        name: result[result.length - 1].name,
                        email: result[result.length - 1].email
                    });
                }
            });
        });

        // When the client emits 'login', save his name and avatar,
        // and add them to the room
        socket.on('login', function (data) {

            // Use the socket object to store data. Each client gets
            // their own unique socket object
            socket.roomId = data.roomId;
            socket.roomName = data.roomName;
            socket.name = data.name;
            socket.email = gravatar.url(data.email, {s: '140', r: 'x', d: 'mm'});

            // Tell the person what he should use for an avatar
            socket.emit('img', socket.email);

            // Add the client to the room
            socket.join(data.roomId);

            //let everybody know that you are in the room
            socket.broadcast.to(this.roomId).emit('joined', {
                result: true,
                roomId: this.roomId,
                name: this.name,
                email: this.email
            });

            //add user to database
            let user = mongodb.createUser(this.roomId, this.roomName, this.name, this.email);

            saveUser(user, data, chat);
        });

        socket.on('type', function () {
            socket.broadcast.to(this.roomId).emit('isTyping', {
                result: true,
                roomId: this.roomId,
                name: this.name,
                email: this.email
            });
        });

        socket.on('updateName', (data) => {
            mongodb.updateUser({name: socket.name, roomId: socket.roomId}, data.name, (err, user) => {
                if (err)
                    return console.log(err);
                if(user) {
                    mongodb.getUsersFromRoom(socket.roomId, function (err, users) {
                        if (err) {
                            console.log(err);
                        } else {
                            let userNames = getUserNamesAndMails(users).userNames;
                            let emails = getUserNamesAndMails(users).emails;

                            console.log(`User ${socket.name} has changed his name into: ${user.name}`);
                            socket.name = user.name;
                            socket.emit('changedName', {result: true, roomId: socket.roomId, name: user.name});
                            socket.broadcast.to(socket.roomId).emit('updateOthers', {
                                result: true,
                                userNames: userNames,
                                emails: emails
                            });
                        }
                    });
                }else{
                    console.log("User exist");
                    socket.emit('changedName', {result: false});
                }
            });
        });

        // Somebody left the chat
        socket.on('disconnect', function () {

            // Notify the other person in the chat room
            // that his partner has left
            socket.broadcast.to(this.roomId).emit('leave', {
                result: true,
                roomId: this.roomId,
                name: this.name,
                email: this.email
            });

            // leave the room
            socket.leave(socket.roomId);
            mongodb.removeUserName(socket.name);
        });

        // Handle the sending of messages
        socket.on('msg', function (data) {

            // When the server receives a message, it sends it to the other person in the room.
            socket.broadcast.to(socket.roomId).emit('receive', {msg: data.msg, name: data.name, img: data.img});
        });
    });
};

function getUserNamesAndMails(users) {
    let userNames = [],
        emails = [];
    for (var i in users) {
        if (Object.prototype.hasOwnProperty.call(users, i)) {
            userNames.push(users[i].name);
            emails.push(users[i].email);
        }
    }
    return {userNames: userNames, emails: emails};
}

function saveUser(user, data, chat) {
    mongodb.saveUser(user, function (err, user) {
        if (err) {
            console.log(err);
        } else {
            console.log(`Saved user: ${user.name}`);
            mongodb.getUsersFromRoom(data.roomId, function (err, users) {
                if (err) {
                    console.log(err);
                } else {
                    let userNames = getUserNamesAndMails(users).userNames;
                    let emails = getUserNamesAndMails(users).emails;

                    // Send the startChat event to all the people in the
                    // room, along with a list of people that are in it.
                    chat.in(data.roomId).emit('startChat', {
                        result: true,
                        roomId: data.roomId,
                        roomName: data.roomName,
                        userNames: userNames,
                        emails: emails
                    });
                }
            });
        }
    });
}




