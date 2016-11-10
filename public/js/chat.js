// This file is executed in the browser, when people visit /chat/<random id>

$(function () {
    // getting the id of the room from the url
    var id = Number(window.location.pathname.match(/\/chat\/(\d+)$/)[1]);

    // connect to the socket
    var socket = io();

    // variables which hold the data for each person
    var name = "",
        email = "",
        img = "",
        others = [],
        room = "",
        timeout="",
        fadeTime = 200;

    // cache some jQuery objects
    var section = $(".section"),
        footer = $("footer"),
        onConnect = $(".connected"),
        inviteSomebody = $(".invite-textfield"),
        personInside = $(".personinside"),
        chatScreen = $(".chatscreen"),
        left = $(".left"),
        noMessages = $(".nomessages")

    // some more jquery objects
    var chatNickname = $(".nickname-chat"),
        roomNickname = $(".nickname-chat-room"),
        leftNickname = $(".nickname-left"),
        uploadForm = $("#uploadForm"),
        loginForm = $(".loginForm"),
        yourName = $("#yourName"),
        yourEmail = $("#yourEmail"),
        roomName = $("#roomName"),
        hisName = $("#hisName"),
        hisEmail = $("#hisEmail"),
        chatForm = $("#chatform"),
        textarea = $("#message"),
        messageTimeSent = $(".timesent"),
        chats = $(".chats"),
        typeForm = $("#typingID"),
        typeName = $(".typing-person");

    // these variables hold images
    var ownerImage = $("#ownerImage"),
        leftImage = $("#leftImage"),
        noMessagesImage = $("#noMessagesImage"),
        creatorImage = $("#creatorImage");

    // on connection to server get the id of person's room
    socket.on('connect', function () {
        socket.emit('load', id);
    });

    // save the gravatar url
    socket.on('img', function (data) {
        img = data;
    });
    // receive the names and avatars of all people in the chat room
    socket.on('peopleinchat', function (data) {
        if (data.number === 0) {
            showMessage("connected");

            loginForm.on('submit', function (e) {
                e.preventDefault();
                room = roomName.val();
                name = $.trim(yourName.val());

                if (room.length < 3) {
                    alert("Please enter a room name longer than 3 character!");
                    return;
                }
                if (name.length < 1) {
                    alert("Please enter a nick name longer than 1 character!");
                    return;
                }
                email = yourEmail.val();
                if (!isValid(email)) {
                    alert("Please enter a valid email!");
                }
                else {
                    showMessage("inviteSomebody");

                    // call the server-side function 'login' and send user's parameters
                    socket.emit('login', {roomName: room, user: name, avatar: email, id: id});
                }
            });
        }
        else {
            showMessage("personinchat", data);
            loginForm.on('submit', function (e) {
                e.preventDefault();
                name = $.trim(hisName.val());
                if (name.length < 1) {
                    alert("Please enter a nick name longer than 1 character!");
                    return;
                }
                if (name == data.user) {
                    alert("There already is a \"" + name + "\" in this room!");
                    return;
                }
                email = hisEmail.val();
                if (!isValid(email)) {
                    alert("Wrong e-mail format!");
                }
                else {
                    socket.emit('login', {roomName:data.roomName, user: name, avatar: email, id: id});
                }
            });
        }
    });

    socket.on('startChat', function (data) {
        if (data.boolean && data.id == id) {
            //chats.empty();
            if (name === data.users[0]) {
                showMessage("youStartedChatWithNoMessages", data);
            }
            else {
                showMessage("heStartedChatWithNoMessages", data);
            }
            if(data.users.length == 1){
                chatNickname.text("nobody");
            }else{
                others = [];
                for ( var i in data.users){
                    if (Object.prototype.hasOwnProperty.call(data.users, i) &&
                        data.users[i] !== name) {
                        others.push(data.users[i]);
                    }
                }
                chatNickname.text(others);
            }
        }
    });

    socket.on('leave', function (data) {
        if (data.boolean && id == data.room) {
            showMessage("somebodyLeft", data);
        }
    });

    socket.on('joined', function (data) {
        if (data.boolean && id == data.room) {
            showMessage("joined", data);
        }
    });

    socket.on('receive', function (data) {
        if (data.msg.trim().length) {
            createChatMessage(data.msg, data.user, data.img, moment());
            scrollToBottom();
        }
    });

    socket.on('isTyping', function (data) {
       if(data.boolean){
           if(timeout)
               clearTimeout(timeout);
           typeForm.css("display", "block");
           typeName.text(data.user);
           timeout = setTimeout(typingTimeout, 1500);
       }
    });

    textarea.keypress(function (e) {

        // Submit the form on enter
        if (e.which == 13) {
            e.preventDefault();
            chatForm.trigger('submit');
        }else{
            socket.emit('type');
        }
    });

    chatForm.on('submit', function (e) {
        e.preventDefault();

        // Create a new chat message and display it directly
        if (textarea.val().trim().length) {
            createChatMessage(textarea.val(), name, img, moment());
            scrollToBottom();

            // Send the message to the other person in the chat
            socket.emit('msg', {msg: textarea.val(), user: name, img: img});
        }
        // Empty the textarea
        textarea.val("");
    });
    uploadForm.on('submit', function(e){
        e.preventDefault();
    });

    // Update the relative time stamps on the chat messages every minute
    setInterval(function () {
        messageTimeSent.each(function () {
            var each = moment($(this).data('time'));
            $(this).text(each.fromNow());
        });
    }, 60000);

    // Function that creates a new chat message
    function createChatMessage(msg, user, imgg, now) {
        var who = '';
        if (user === name) {
            who = 'me';
        }
        else {
            who = 'you';
        }
        var li = $(
            '<li class=' + who + '>' +
            '<div class="image">' +
            '<img src=' + imgg + ' />' +
            '<b></b>' +
            '<i class="timesent" data-time=' + now + '></i> ' +
            '</div>' +
            '<p></p>' +
            '</li>');

        // use the 'text' method to escape malicious user input
        li.find('p').text(msg);
        li.find('b').text(user);

        chats.append(li);

        messageTimeSent = $(".timesent");
        messageTimeSent.last().text(now.fromNow());
    }

    function scrollToBottom() {
        $("html, body").animate({scrollTop: $(document).height() - $(window).height()}, 1000);
    }

    function isValid(thatemail) {

        var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(thatemail);
    }

    function typingTimeout(){
        typeForm.css("display", "none");
    }

    function showMessage(status, data) {
        chatScreen.css('display', 'block');
        if (status === "connected") {

            //section.children().css('display', 'none');
            onConnect.fadeIn(fadeTime);
        }
        else if (status === "inviteSomebody") {

            // Set the invite link content
            $("#link").text(window.location.href);

            onConnect.fadeOut(fadeTime, function () {
                inviteSomebody.fadeIn(fadeTime);
            });
        }
        else if (status === "personinchat") {

            onConnect.css("display", "none");
            personInside.fadeIn(fadeTime);

            roomNickname.text(data.roomName);
            ownerImage.attr("src", data.avatar);
        }
        else if (status === "youStartedChatWithNoMessages") {

            left.fadeOut(fadeTime, function () {
                inviteSomebody.fadeOut(fadeTime, function () {
                    noMessages.fadeIn(fadeTime);
                    footer.fadeIn(fadeTime);
                });
            });

            noMessagesImage.attr("src", data.avatars[1]);
        }
        else if (status === "heStartedChatWithNoMessages") {
            personInside.fadeOut(fadeTime, function () {
                noMessages.fadeIn(fadeTime);
                footer.fadeIn(fadeTime);
            });
            noMessagesImage.attr("src", data.avatars[0]);
        }
        else if (status === "somebodyLeft") {
                createChatMessage("Has left this room", data.user, data.avatar, moment());
                scrollToBottom();
            var index = others.indexOf(data.user);
            if(index > -1)
                others.splice(index, 1);
            chatNickname.text(others);

        }
        else if (status == "joined") {
            createChatMessage(data.user.concat(" has joined this room. Say hello"), data.user, data.avatar, moment());
            scrollToBottom();
        }
    }
});
