var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

mongoose.connect('mongodb://localhost/web-chat');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    // we're connected!
    console.log("we are connected!");
});

var userSchema = new Schema({
    roomId: String,
    roomName: String,
    name: String,
    email: String
});

var User = mongoose.model('newUser', userSchema);

function saveUser(myUser, cb) {
    myUser.save(function (err, user) {
        if (err)
            return cb(err);
        return cb(null, user);
    });
}

function getAllUsers() {
    User.find(function (err, users) {
        if (err)
            console.log('error getting users: ' + err);
        console.log("These are all users: \n" + users);
        return users;
    });
}

function getUsersFromRoom(query, cb) {
    User.find({'roomId': query}, 'roomId roomName name email', function (err, users) {
        if (err) {
            console.log("Error occurred: " + err);
            return cb(err);
        }
        console.log("users from room " + query + ": " + users);
        return cb(null, users);
    });
}

function getUser(username) {
    User.find({'name': username}, 'roomId name email', function (err, user) {
        if (err)
            return console.log("Error occurred: " + err);
        console.log("User with name " + username + ": " + users);
        return users;
    });
}

function removeRoom(roomId) {
    User.find({'roomId': roomId}).remove(function (err, result) {
        if (err)
            return console.log(err);
        console.log("Room removed: " + result);
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
    User: User,
    saveUser: saveUser,
    getAllUsers: getAllUsers,
    getUsersFromRoom: getUsersFromRoom,
    getUser: getUser,
    removeRoom: removeRoom,
    removeAll: removeAll
};