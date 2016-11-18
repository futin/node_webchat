// This file is executed in the browser, when people visit /chat/<random id>
$(() => {
    // getting the id of the room from the url
    const roomId = Number(window.location.pathname.match(/\/chat\/(\d+)$/)[1]);
    // connect to the socket
    const socket = io();

    //we are using this util script for socket listener names
    const socketListener = utils.socketListener;
    const showMessageString = utils.showMessage;

    // variables which hold the data for each person
    let name = "",
        email = "",
        img = "",
        room = "",
        timeout = "",
        others = [],
        fadeTime = 200;

    // cache some jQuery objects
    let section = $(".section"),
        footer = $("footer"),
        onConnect = $(".connected"),
        inviteSomebody = $(".invite-textfield"),
        personInside = $(".personinside"),
        chatScreen = $(".chatscreen"),
        left = $(".left"),
        noMessages = $(".nomessages")

    // some more jquery objects
    let chatNickname = $(".nickname-chat"),
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
    let ownerImage = $("#ownerImage"),
        leftImage = $("#leftImage"),
        noMessagesImage = $("#noMessagesImage"),
        creatorImage = $("#creatorImage");

    // on connection to server get the id of person's room
    socket.on('connect', () => {
        socket.emit(socketListener.load, roomId);
    });

    // save the gravatar url
    socket.on(socketListener.img, (data) => {
        img = data;
    });

    // receive the names and avatars of all people in the chat room
    socket.on(socketListener.peopleInChat, (data) => {
        if (data.number === 0) {
            showMessage(showMessageString.connected);

            loginForm.on('submit', (e) => {
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
                } else {
                    showMessage(showMessageString.inviteSomebody);

                    // call the server-side function 'login' and send user's parameters
                    socket.emit(socketListener.login, {roomId: roomId, roomName: room, name: name, email: email});
                }
            });
        } else {
            showMessage(showMessageString.personInChat, data);
            loginForm.on('submit', (e) => {
                e.preventDefault();
                name = $.trim(hisName.val());
                if (name.length < 1) {
                    alert("Please enter a nick name longer than 1 character!");
                    return;
                }
                if (name == data.name) {
                    alert(`There already is a ${name} in this room!`);
                    return;
                }
                email = hisEmail.val();
                if (!isValid(email)) {
                    alert("Wrong e-mail format!");
                } else {
                    socket.emit(socketListener.login, {
                        roomName: data.roomName,
                        name: name,
                        email: email,
                        roomId: roomId
                    });
                }
            });
        }
    });

    socket.on(socketListener.startChat, (data) => {
        if (data.result && data.roomId == roomId) {
            showMessage(showMessageString.startChat, data);
        }
    });

    socket.on(socketListener.somebodyLeft, (data) => {
        if (data.result && roomId == data.roomId) {
            showMessage(showMessageString.somebodyLeft, data);
        }
    });

    socket.on(socketListener.somebodyJoined, (data) => {
        if (data.result && roomId == data.roomId) {
            showMessage(showMessageString.somebodyJoined, data);
        }
    });

    socket.on(socketListener.receive, (data) => {
        if (data.msg.trim().length) {
            createChatMessage(data.msg, data.name, data.img, moment());
            scrollToBottom();
        }
    });

    socket.on(socketListener.isTyping, (data) => {
        if (data.result) {
            if (timeout)
                clearTimeout(timeout);
            typeForm.css("display", "block");
            typeName.text(data.name);
            timeout = setTimeout(typingTimeout, 1500);
        }
    });

    socket.on(socketListener.updateOthers, (data) => {
        if (data.result) {
            setOthers(data);
        }
    });

    socket.on(socketListener.changedName, (data) => {
        if (data.result && roomId === data.roomId) {
            name = data.name;
            alert(`Name changed successfully into ${name}`);
        } else {
            alert(`Something went wrong`);
        }
    });

    textarea.keypress((e) => {

        // Submit the form on enter
        if (e.which == 13) {
            e.preventDefault();
            chatForm.trigger('submit');
        } else {
            socket.emit(socketListener.type);
        }
    });

    chatForm.on('submit', (e) => {
        e.preventDefault();

        // Create a new chat message and display it directly
        if (textarea.val().trim().length) {
            if (textarea.val().startsWith('#')) {
                if (textarea.val().indexOf('clear') > -1) {
                    chats.empty();
                } else if (textarea.val().indexOf('ch:name=') > -1) {
                    let txt = "ch:name=";
                    let updateName = textarea.val().substring(txt.length + 1, textarea.val().length);
                    socket.emit(socketListener.updateName, {name: updateName});
                }
            } else {
                createChatMessage(textarea.val(), name, img, moment());
                scrollToBottom();

                // Send the message to the other person in the chat
                socket.emit(socketListener.msg, {msg: textarea.val(), name: name, img: img});
            }
        }
        // Empty the textarea
        textarea.val("");
    });

    uploadForm.on('submit', (e) => {
        e.preventDefault();
    });

    // Update the relative time stamps on the chat messages every minute
    setInterval(() => {
        messageTimeSent.each(function () {
            let each = moment($(this).data('time'));
            $(this).text(each.fromNow());
        });
    }, 60000);

    // Function that creates a new chat message
    function createChatMessage(msg, user, imgg, now) {
        let who = '';
        if (user === name) {
            who = 'me';
        } else {
            who = 'you';
        }
        let li = $(
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

        let re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(thatemail);
    }

    function typingTimeout() {
        typeForm.css("display", "none");
    }

    function removeFromArray(array, data) {
        let index = array.indexOf(data);
        if (index > -1)
            array.splice(index, 1);
    }

    function setOthers(data) {
        others = [];
        for (var i in data.userNames) {
            if (Object.prototype.hasOwnProperty.call(data.userNames, i) &&
                data.userNames[i] !== name) {
                others.push(data.userNames[i]);
            }
        }
        chatNickname.text(others);
    }

    function showMessage(status, data) {
        chatScreen.css('display', 'block');
        switch (status) {
            case showMessageString.connected:
                onConnect.fadeIn(fadeTime);
                break;
            case showMessageString.personInChat:
                onConnect.css("display", "none");
                personInside.fadeIn(fadeTime);

                roomNickname.text(data.roomName);
                ownerImage.attr("src", data.email);
                break;
            case showMessageString.inviteSomebody:
                onConnect.fadeOut(fadeTime);
                break;
            case showMessageString.startChat:
                personInside.fadeOut(fadeTime, () => {
                    if (data.userNames && data.userNames.length == 1) {

                        // Set the invite link content
                        $("#link").text(window.location.href);
                        inviteSomebody.fadeIn(fadeTime);
                        chatNickname.text("nobody");
                    } else {
                        inviteSomebody.fadeOut(fadeTime);
                        setOthers(data);
                    }
                });

                noMessages.fadeIn(fadeTime);
                footer.fadeIn(fadeTime);
                noMessagesImage.attr("src", data.emails[1]);
                break;
            case showMessageString.somebodyLeft:
                createChatMessage(`${data.name} has left this room`, data.name, data.email, moment());
                scrollToBottom();

                removeFromArray(others, data.name);

                if (others.length > 0) {
                    chatNickname.text(others);
                } else {
                    chatNickname.text("nobody");
                }
                break;
            case showMessageString.somebodyJoined:
                createChatMessage(`${data.name} has joined this room. Say hello`, data.name, data.email, moment());
                scrollToBottom();
                break;
        }
    }
});
