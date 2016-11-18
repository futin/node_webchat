const mongoose = require('mongoose'),
    uri = require('../public/js/utils').utils.mongoDB.loadUri,
    log = require('../public/js/logger').logger;

const Schema = mongoose.Schema;

mongoose.connect(uri);

const db = mongoose.connection;
db.on('error', (err) => {
    log.debug(err);
});
db.once('open', () => {
    log.debug("We are connected!");
});

const userSchema = new Schema({
    roomId: String,
    roomName: String,
    name: String,
    email: String
});

const User = mongoose.model('user', userSchema);

function createUser(roomId, roomName, name, email) {
    return new User({
        roomId: roomId,
        roomName: roomName,
        name: name,
        email: email
    });
}

function saveUser(myUser, cb) {
    myUser.save((err, user) => {
        if (err)
            return cb(err);
        cb(null, user);
    });
}

function updateUser(myUser, newName, cb) {
    User.findOne({'name': myUser.name, 'roomId': myUser.roomId}, (err, user) => {
        if (err)
            return cb(err);
        if (!user) {
            return log.debug(`User does not exist`);
        }
        getUsersFromRoom(user.roomId, (err, users) => {
            let nameExist = false;

            users.forEach(user => {
               if(user.name === newName)
                   nameExist = true;
            });

            if (!nameExist) {
                user.name = newName;
                user.save((err, user) => {
                    if (err)
                        return cb(err);
                    cb(null, user);
                });
            }else{
                cb(null);
            }
        });
    });
}

function getAllUsers(cb) {
    User.find({}, 'roomId roomName name email', (err, users) => {
        if (err)
            return cb(err);
        log.debug(`These are all users: \n ${users}`);
        cb(null, users);
    });
}

function getUsersFromRoom(query, cb) {
    User.find({'roomId': query}, 'roomId roomName name email', (err, users) => {
        if (err) {
            log.debug(`Error occurred: ${err}`);
            return cb(err);
        }
        if (users.length === 0) {
            log.debug(`No users in room ${query}`);
        } else {
            log.debug(`Users from room ${query}`);
            users.forEach( user =>{
                log.debug(`- ${user.name}`);
            });
        }
        cb(null, users);
    });
}

function getUser(username, cb) {
    User.find({'name': username}, 'roomId roomName name email', (err, user) => {
        if (err)
            return cb(err);
        log.debug(`User with name: ${user.name}`);
        cb(null, user);
    });
}

function removeUserName(name) {
    User.find({'name': name}).remove((err, result) => {
        if (err)
            return log.debug(err);
        log.debug(`User removed`);
    });
}

function removeUserRoom(roomId) {
    User.find({'roomId': roomId}).remove((err, result) => {
        if (err)
            return log.debug(err);
        log.debug("Room removed");
    });
}

function removeAll() {
    User.find({}).remove((err, result) => {
        if (err)
            return log.debug(err);
        log.debug("All data removed");
    });
}

module.exports = {
    createUser: createUser,
    saveUser: saveUser,
    updateUser: updateUser,
    getAllUsers: getAllUsers,
    getUsersFromRoom: getUsersFromRoom,
    getUser: getUser,
    removeUserRoom: removeUserRoom,
    removeAll: removeAll,
    removeUserName: removeUserName
};