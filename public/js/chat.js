// This file is executed in the browser, when people visit /chat/<random id>

$(function () {
    // getting the id of the room from the url
    var roomId = Number(window.location.pathname.match(/\/chat\/(\d+)$/)[1]);

    // connect to the socket
    var socket = io();

    // variables which hold the data for each person
    var name = "",
        email = "",
        img = "",
        room = "",
        timeout="",
        others = [],
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
        socket.emit('load', roomId);
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
                }else {
                    showMessage("inviteSomebody");

                    // call the server-side function 'login' and send user's parameters
                    socket.emit('login', {roomId: roomId, roomName: room, name: name, email: email });
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
                if (name == data.name) {
                    alert("There already is a \"" + name + "\" in this room!");
                    return;
                }
                email = hisEmail.val();
                if (!isValid(email)) {
                    alert("Wrong e-mail format!");
                }else {
                    socket.emit('login', {roomName:data.roomName, name: name, email: email, roomId: roomId});
                }
            });
        }
    });

    socket.on('startChat', function (data) {
        if (data.emitted && data.roomId == roomId) {
            if (name === data.userNames[0]) {
                showMessage("youStartedChatWithNoMessages", data);
            }else {
                showMessage("heStartedChatWithNoMessages", data);
            }
            if(data.userNames.length == 1){
                chatNickname.text("nobody");
            }else{
                others = [];
                for ( var i in data.userNames){
                    if (Object.prototype.hasOwnProperty.call(data.userNames, i) &&
                        data.userNames[i] !== name) {
                        others.push(data.userNames[i]);
                    }
                }
                chatNickname.text(others);
            }
        }
    });

    socket.on('leave', function (data) {
        if (data.emitted && roomId == data.roomId) {
            showMessage("somebodyLeft", data);
        }
    });

    socket.on('joined', function (data) {
        if (data.emitted && roomId == data.roomId) {
            showMessage("joined", data);
        }
    });

    socket.on('receive', function (data) {
        if (data.msg.trim().length) {
            createChatMessage(data.msg, data.name, data.img, moment());
            scrollToBottom();
        }
    });

    socket.on('isTyping', function (data) {
       if(data.emitted){
           if(timeout)
               clearTimeout(timeout);
           typeForm.css("display", "block");
           typeName.text(data.name);
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
            socket.emit('msg', {msg: textarea.val(), name: name, img: img});
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
        }else {
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
        $("html, body").animate({scrollTop: $(document).height() - $(window).height()}, fadeTime);
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
        }else if (status === "inviteSomebody") {

            // Set the invite link content
            $("#link").text(window.location.href);

            onConnect.fadeOut(fadeTime, function () {
                inviteSomebody.fadeIn(fadeTime);
            });
        }else if (status === "personinchat") {

            onConnect.css("display", "none");
            personInside.fadeIn(fadeTime);

            roomNickname.text(data.roomName);
            ownerImage.attr("src", data.email);
        }else if (status === "youStartedChatWithNoMessages") {

            left.fadeOut(fadeTime, function () {
                inviteSomebody.fadeOut(fadeTime, function () {
                    noMessages.fadeIn(fadeTime);
                    footer.fadeIn(fadeTime);
                });
            });

            noMessagesImage.attr("src", data.emails[1]);
        }else if (status === "heStartedChatWithNoMessages") {
            personInside.fadeOut(fadeTime, function () {
                noMessages.fadeIn(fadeTime);
                footer.fadeIn(fadeTime);
            });
            noMessagesImage.attr("src", data.emails[0]);
        }else if (status === "somebodyLeft") {
                createChatMessage("Has left this room", data.name, data.email, moment());
                scrollToBottom();

            var index = others.indexOf(data.name);
            if(index > -1)
                others.splice(index, 1);

            if(others.length > 0){
                chatNickname.text(others);
            }else{
                chatNickname.text("nobody");
            }
        }else if (status == "joined") {
            createChatMessage(data.name.concat(" has joined this room. Say hello"), data.name, data.email, moment());
            scrollToBottom();
        }
    }
});
