let db = require('./database/mongoDB');
let User = db.User;

let user = new User({
    roomId: "roomId",
    roomName: 'roomName',
    name: 'name',
    email: 'email'
});

describe('test saving user', () => {
    "use strict";
    it('Should save user', (done) => {
        db.saveUser(user, (err, user) => {
            if (err) {
                done(err);
            } else {
                console.log(user.name);
                db.getAllUsers((err, result) => {
                    done();
                });
            }
        });
    });
});

describe('test removing user', () => {
    "use strict";
    it('Should remove user', (done) => {
        db.removeAll();
        done();
    });
});

