const mongoose = require('mongoose'),
    Schema = mongoose.Schema;
var uri = 'mongodb://admin:admin@ds029665.mlab.com:29665/futinsdatabase';
mongoose.connect(uri);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log("we are connected!");
});

const userSchema = new Schema({
    roomId: String,
    roomName: String,
    name: String,
    email: String
});

const User = mongoose.model('newUser', userSchema);

function createUser(roomId, roomName, name, email) {
    return new User({
        roomId: roomId,
        roomName: roomName,
        name: name,
        email: email
    });
}

function saveUser(myUser, cb) {
    myUser.save(function (err, user) {
        if (err)
            return cb(err);
        cb(null, user);
    });
}

function updateUser(myUser, newName, cb){
    "use strict";
    User.findOne({ 'name': myUser.name, 'roomId': myUser.roomId}, function (err, user){
        if(err)
            return cb(err);
        if(!user){
            return console.log(`User does not exist`);
        }
        user.name = newName;
        console.log("changed:", user);
        user.save(function(err, user){
            if(err)
                return cb(err);
            cb(null, user);
        });
    });
}

function getAllUsers(cb) {
    User.find({},'roomId roomName name email', function (err, users) {
        if (err)
            return cb(err);
        console.log(`These are all users: \n ${users}`);
        cb(null, users);
    });
}

function getUsersFromRoom(query, cb) {
    User.find({'roomId': query}, 'roomId roomName name email', function (err, users) {
        if (err) {
            console.log(`Error occurred: ${err}`);
            return cb(err);
        }
        if(users.length === 0)
            console.log(`no users in room ${query}`);
        else
            console.log(`users from room ${query}: ${users}`);
        cb(null, users);
    });
}

function getUser(username, cb) {
    User.find({'name': username}, 'roomId roomName name email', function (err, user) {
        if (err)
            return cb(err);
        console.log(`User with name: ${user.name}`);
        cb(null, user);
    });
}

function removeUserName(name){
    User.find({'name': name}).remove(function (err, result) {
        if (err)
            return console.log(err);
        console.log(`Person removed`);
    });
}

function removeUserRoom(roomId) {
    User.find({'roomId': roomId}).remove(function (err, result) {
        if (err)
            return console.log(err);
        console.log("Room removed");
    });
}

function removeAll() {
    User.find({}).remove(function (err, result) {
        if (err)
            return console.log(err);
        console.log("All data removed");
    });
}

module.exports = {
    createUser:createUser,
    saveUser: saveUser,
    updateUser: updateUser,
    getAllUsers: getAllUsers,
    getUsersFromRoom: getUsersFromRoom,
    getUser: getUser,
    removeUserRoom: removeUserRoom,
    removeAll: removeAll,
    removeUserName: removeUserName
};