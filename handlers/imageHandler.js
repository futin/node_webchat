'use strict';

var multer = require('multer')({
    dest: '../public/img',
    fileSize: 5 * 1024 * 1024, // no larger than 5mb
    rename: function (fieldname, filename) {
        // generate a unique filename
        return filename.replace(/\W+/g, '-').toLowerCase() + Date.now();
    }
});

module.exports = {
    upload: multer.single('avatarImg')
};
