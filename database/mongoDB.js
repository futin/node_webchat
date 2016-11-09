var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

mongoose.connect('mongodb://localhost/web-chat');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    // we're connected!
    console.log("we are connected!");
});

var userSchema = new Schema({
    roomId: String,
    name: String,
    email: String
});

var User = mongoose.model('newUser', userSchema);

function saveUser(myUser) {
    myUser.save(function (err, user) {
        if (err)
            return console.log(err);
        console.log("User saved: " + user.name);
        return user;
    });

}

function getAllUsers(){
    User.find(function (err, users) {
        if (err)
            console.log('error getting users: ' + err);
        console.log("These are all users: \n" + users);
        return users;
    });
}

function getSpecificData(query){
    User.find({'roomId': query}, 'roomId name email', function (err, users) {
        if(err)
            return console.log("Error occurred: "+err);
        console.log("Specific data: "+users);
        return users;
    });
}
function removeAll() {
    User.find({}).remove(function (err, result) {
        if (err)
            return console.log(err);
        console.log("Room removed: " + result);
    });
}

function removeRoom(roomId){
    User.find({'roomId': roomId}).remove(function (err, result) {
        if (err)
            return console.log(err);
        console.log("Room removed: " + result);
    });

}

module.exports = {
    User: User,
    saveUser: saveUser,
    getAllUsers: getAllUsers,
    getSpecificData: getSpecificData,
    removeRoom: removeRoom,
    removeAll: removeAll
};