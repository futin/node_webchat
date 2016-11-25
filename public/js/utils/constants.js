var utils = {
    socketListener : {
        load : "load",
        peopleInChat : "peopleInChat",
        login : "login",
        img : "image",
        somebodyJoined: "somebodyJoined",
        startChat : "startChat",
        type: "type",
        isTyping : "isTyping",
        updateName : "updateName",
        changedName : "changedName",
        updateOthers : "updateOthers",
        msg : "message",
        receive : "receive",
        disconnect : "disconnect",
        somebodyLeft : "somebodyLeft"
    },
    showMessage : {
        connected : "connected",
        inviteSomebody : "inviteSomebody",
        personInChat : "personInChat",
        somebodyLeft : "somebodyLeft",
        somebodyJoined: "somebodyJoined",
        startChat : "startChat",
    },
    mongoDB : {
        loadUri : "mongodb://admin:admin@ds029665.mlab.com:29665/futinsdatabase"
    }
};

module.exports = {
    utils
};