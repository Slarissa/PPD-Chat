const socket = io();

let username = '';
let currentRoom = '';
let userList = [];
let userColors = {}; 

let loginPage = document.querySelector('#loginPage');
let chatPage = document.querySelector('#chatPage');
let loginInput = document.querySelector('#loginNameInput');
let roomSelect = document.querySelector('#roomSelect');
let textInput = document.querySelector('#chatTextInput');
let enterRoomButton = document.getElementById('enterRoomButton');
let leaveRoomButton = document.getElementById('leaveRoomButton');

// Esconde o botão de "Sair" até que o usuário entre na sala
leaveRoomButton.style.display = 'none';

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function renderUserList() {
    let ul = document.querySelector('.userList');
    ul.innerHTML = '';  // Limpa a lista de usuários antes de renderizar novamente
    userList.forEach(user => {
        let li = document.createElement('li');
        li.textContent = user;
        li.style.color = userColors[user]; 
        ul.appendChild(li);
    });
}

function addMessage(type, user, msg) {
    let ul = document.querySelector('#chatArea');
    let color = userColors[user] || '#333'; 
    switch (type) {
        case 'status':
            ul.innerHTML += `<div class="m-status">${msg}</div>`;
            break;
        case 'msg':
            if (username == user) {
                ul.innerHTML += `<div class="m-txt"><span class="me" style="color:${color}">${user}</span>: ${msg}</div>`;
            } else {
                ul.innerHTML += `<div class="m-txt"><span style="color:${color}">${user}</span>: ${msg}</div>`;
            }
            break;
    }
    ul.scrollTop = ul.scrollHeight;  
}

// Restaurar os estilos da página de login
function resetLoginPageStyle() {
    loginPage.style.boxShadow = '';  
    loginPage.style.padding = '';  
    loginPage.style.transform = '';  
    document.body.style.backgroundColor = ''; 
    document.body.style.margin = ''; 
    loginInput.value = ''; 
    roomSelect.value = 'Sala1'; 
}

// Evento para o botão "Entrar"
enterRoomButton.addEventListener('click', () => {
    let name = loginInput.value.trim();
    let room = roomSelect.value.trim();

    if (name !== '' && room !== '') {
        username = name;
        currentRoom = room;
        document.title = `Chat (${username})`;

        console.log('Entrando na sala', room); 

        userColors[username] = getRandomColor();

        // Emitir o evento para o servidor para entrar na sala
        socket.emit('join-room', { username, room });

        // Mudar a tela para o chat
        loginPage.style.display = 'none';
        chatPage.style.display = 'flex';
        textInput.focus();

        // Trocar os botões
        enterRoomButton.style.display = 'none';
        leaveRoomButton.style.display = 'inline-block';

        // Ajustar o estilo do body para a sala de chat
        document.body.style.backgroundColor = '#f5f5f5'; 
        document.body.style.margin = '0';  
    } else {
        alert('Por favor, insira um nome e selecione uma sala.');
    }
});

// Evento para o botão "Sair"
leaveRoomButton.addEventListener('click', () => {
    // Emitir evento para o servidor para sair da sala
    socket.emit('leave-room', currentRoom);

    // Voltar à página de login
    loginPage.style.display = 'flex';
    chatPage.style.display = 'none';

    // Resetar variáveis
    currentRoom = '';
    username = '';
    userList = [];
    userColors = {}; // Resetar as cores

    resetLoginPageStyle();

    document.getElementById('roomName').innerText = ''; // Limpar nome da sala
    document.querySelector('.userList').innerHTML = ''; // Limpar lista de usuários
    document.querySelector('#chatArea').innerText = ''; // Limpar caixa de mensagem

    // Trocar os botões
    enterRoomButton.style.display = 'inline-block';
    leaveRoomButton.style.display = 'none';
});

// confirmação de que o usuário entrou na sala
socket.on('user-ok', (data) => {
    currentRoom = data.room;
    userList = data.users;

    // Exibe o nome da sala no título
    document.getElementById('roomName').innerText = currentRoom;

    renderUserList();
});

socket.on('show-msg', (data) => {
    addMessage('msg', data.username, data.message);
});

socket.on('user-left', (data) => {
    addMessage('status', null, `${data.username} saiu da sala`);
    userList = userList.filter(user => user !== data.username);
    renderUserList();
});

socket.on('user-joined', (data) => {
    addMessage('status', null, `${data.username} entrou na sala`);
    userList.push(data.username);
    userColors[data.username] = getRandomColor();  // Atribui uma cor para o novo usuário
    renderUserList();
});

textInput.addEventListener('keyup', (e) => {
    if (e.keyCode === 13) { // Enviar mensagem ao pressionar "Enter"
        let txt = textInput.value.trim();
        textInput.value = '';

        if (txt !== '') {
            addMessage('msg', username, txt);
            socket.emit('send-msg', { room: currentRoom, message: txt });
        }
    }
});

// Ouvindo o botão de "Enviar" para enviar a mensagem
textInput.addEventListener('blur', () => {
    let txt = textInput.value.trim();
    textInput.value = '';
    if (txt !== '') {
        addMessage('msg', username, txt);
        socket.emit('send-msg', { room: currentRoom, message: txt });
    }
});



