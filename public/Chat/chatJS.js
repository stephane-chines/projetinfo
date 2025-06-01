const subject = 'Maths';

const contenu = document.getElementById('contenu');
let allChatBlock = document.createElement('div');
allChatBlock.className = 'all-chat-block';

const chatBox = document.getElementById('chatbox');
chatBox.className = 'chatbox';

const chatInput = document.createElement('textarea');
chatInput.className = 'chat-input';
chatInput.placeholder = 'Envoyer un chat ...';
const sendButton = document.createElement('button');
sendButton.innerHTML = `<svg fill="none" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><g stroke="antiquewhite" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="m7.39999 6.32003 8.49001-2.83c3.81-1.27 5.88.81 4.62 4.62l-2.83 8.48997c-1.9 5.71-5.02 5.71-6.92 0l-.84001-2.52-2.52-.84c-5.71-1.9-5.71-5.00997 0-6.91997z"/><path d="m10.11 13.6501 3.58-3.59"/></g></svg>`;
sendButton.className = 'send-button';

sendButton.addEventListener('click', () => {
    const corps = chatInput.value.trim();
    if (corps) {
        const username = "Utilisateur Anonyme";
        new_chat(corps, username, subject);
        chatInput.value = '';
    }
});

chatBox.appendChild(chatInput);
chatBox.appendChild(sendButton);


function createSingleChatBlock(IDChat,corps,date,username) {
    const singleChatBlock = document.createElement('div');
    singleChatBlock.className = 'single-chat-block';

    const chatUser = document.createElement('p');
    chatUser.textContent = username;
    singleChatBlock.appendChild(chatUser);

    const chatDate = document.createElement('p');
    chatDate.textContent = date;
    singleChatBlock.appendChild(chatDate);

    allChatBlock.appendChild(singleChatBlock);

    const chatContent = document.createElement('p');
    chatContent.textContent = corps;
    singleChatBlock.appendChild(chatContent);
}



function get_all_chats(subject) {
    if (contenu.contains(allChatBlock)) {
        contenu.removeChild(allChatBlock);
    }
    allChatBlock.innerHTML = '';
    fetch(`/get-chat/${subject}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(res => res.json())
        .then(data => {
            data.sort((a, b) => new Date(a.date) - new Date(b.date));
            data.forEach(chat => {
                createSingleChatBlock(chat.IDChat, chat.corps, chat.date, chat.username);
            });
            // On ajoute la boîte d'envoi et les chats
            contenu.appendChild(allChatBlock);
        });
}


function new_chat(corps, username, subject) {
    fetch('/api/new-chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ corps, username, subject })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            createSingleChatBlock(data.IDChat, corps, date, username);
        } else {
            console.error('Error creating chat:', data.message);
        }
    });
    get_all_chats(subject);
}

get_all_chats(subject);
setInterval((subject = "Maths") => {
    fetch(`/get-nb-chats/${subject}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(res => res.json())
        .then(data => {
            let nbchats = data.nbchats;
            console.log('Nombre de chats:', nbchats);
            if (nbchats != allChatBlock.children.length) {
                get_all_chats(subject);
            }
        });
}, 2000);
