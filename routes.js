// This file is required by app.js. It sets up event listeners
// for the two main URL endpoints of the application - /create and /chat/:id
// and listens for socket.io messages.

// Use the gravatar module, to turn email addresses into avatar images:

const gravatar = require('gravatar'),
    mongodb = require('./database/mongoDB'),
    socketListener = require('./public/js/utils').utils.socketListener,
    log = require('./public/js/logger').logger;
//const handler = require('./myhandlers/imageHandler');

// Export a function, so that we can pass
// the app and io instances from the app.js file:

module.exports = (app, io) =>  {
    app.get('/', (req, res) =>  {

        // Render views/home.html
        res.render('home');
    });

    app.get('/create', (req, res) => {

        // Generate unique id for the room
        let id = Math.round((Math.random() * 1000000));

        // Redirect to the random room
        res.redirect('/chat/' + id);
    });

    app.get('/chat/:id', (req, res) => {

        // Render the chant.html view
        res.render('chat');
    });

    // Initialize a new socket.io application, named 'chat'
    let chat = io.on('connection', (socket) => {

        // When the client emits the 'load' event, reply with the
        // number of people in this chat room
        socket.on(socketListener.load, (data) => {
            mongodb.getUsersFromRoom(data, (err, result) =>  {
                if (err) {
                    log.debug(err);
                    return;
                }
                if (result.length === 0) {
                    socket.emit(socketListener.peopleInChat, {number: 0});
                } else {
                    socket.emit(socketListener.peopleInChat, {
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
        socket.on(socketListener.login, (data) =>  {

            // Use the socket object to store data. Each client gets
            // their own unique socket object
            socket.roomId = data.roomId;
            socket.roomName = data.roomName;
            socket.name = data.name;
            socket.email = gravatar.url(data.email, {s: '140', r: 'x', d: 'mm'});

            // Tell the person what he should use for an avatar
            socket.emit(socketListener.img, socket.email);

            // Add the client to the room
            socket.join(data.roomId);

            //let everybody know that you are in the room
            socket.broadcast.to(socket.roomId).emit(socketListener.somebodyJoined, {
                result: true,
                roomId: socket.roomId,
                name: socket.name,
                email: socket.email
            });

            //add user to database
            let user = mongodb.createUser(socket.roomId, socket.roomName, socket.name, socket.email);

            saveUser(user, data, chat);
        });

        socket.on(socketListener.type, () =>  {
            socket.broadcast.to(socket.roomId).emit(socketListener.isTyping, {
                result: true,
                roomId: socket.roomId,
                name: socket.name,
                email: socket.email
            });
        });

        socket.on(socketListener.updateName, (data) => {
            mongodb.updateUser({name: socket.name, roomId: socket.roomId}, data.name, (err, user) => {
                if (err)
                    return log.debug(err);
                if(user) {
                    mongodb.getUsersFromRoom(socket.roomId, (err, users) =>  {
                        if (err) {
                            log.debug(err);
                        } else {
                            let userNames = getUserNamesAndMails(users).userNames;
                            let emails = getUserNamesAndMails(users).emails;

                            log.debug(`User ${socket.name} has changed his name into: ${user.name}`);
                            socket.name = user.name;
                            socket.emit(socketListener.changedName, {result: true, roomId: socket.roomId, name: user.name});
                            socket.broadcast.to(socket.roomId).emit(socketListener.updateOthers, {
                                result: true,
                                userNames: userNames,
                                emails: emails
                            });
                        }
                    });
                }else{
                    log.debug("User already exist");
                    socket.emit(socketListener.changedName, {result: false});
                }
            });
        });

        // Handle the sending of messages
        socket.on(socketListener.msg, (data) =>  {

            // When the server receives a message, it sends it to the other person in the room.
            socket.broadcast.to(socket.roomId).emit(socketListener.receive, {msg: data.msg, name: data.name, img: data.img});
        });

        // Somebody left the chat
        socket.on(socketListener.disconnect, () =>  {

            // Notify the other person in the chat room
            // that his partner has left
            socket.broadcast.to(socket.roomId).emit(socketListener.somebodyLeft, {
                result: true,
                roomId: socket.roomId,
                name: socket.name,
                email: socket.email
            });

            // leave the room
            socket.leave(socket.roomId);
            mongodb.removeUserName(socket.name);
        });
    });
};

function getUserNamesAndMails(users) {
    let userNames = [],
        emails = [];

    if(users){
        users.forEach(user => {
            userNames.push(user.name);
            emails.push(user.email);
        });
    }

    return {userNames: userNames, emails: emails};
}

function saveUser(user, data, chat) {
    mongodb.saveUser(user, (err, user) =>  {
        if (err) {
            log.debug(err);
        } else {
            log.debug(`Saved user: ${user.name}`);
            mongodb.getUsersFromRoom(data.roomId, (err, users) =>  {
                if (err) {
                    log.debug(err);
                } else {
                    let userNames = getUserNamesAndMails(users).userNames;
                    let emails = getUserNamesAndMails(users).emails;

                    // Send the startChat event to all the people in the
                    // room, along with a list of people that are in it.
                    chat.in(data.roomId).emit(socketListener.startChat, {
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




