const IDSubject = localStorage.getItem("selectedSubjectID");
const username = localStorage.getItem("username");
const IDUser = localStorage.getItem("IDUser");
const contenu = document.getElementById('contenu');
const chatBox = document.getElementById('chatbox');
const QuestionsReponses = document.getElementById("QR");
const Documents = document.getElementById("Documents");
const RetourLobby = document.getElementById("bouton-menu");

QuestionsReponses.addEventListener("click", () => {
    window.location.href = "/QR/index.html";
});

Documents.addEventListener("click", () => {
    window.location.href = "/documents/documents.html";
});

RetourLobby.addEventListener("click", () => {
    window.location.href = "/accueil/Accueil.html";
});

let allChatBlock = document.createElement('div');
allChatBlock.className = 'all-chat-block';


chatBox.className = 'chatbox';

const chatInput = document.createElement('textarea');
chatInput.className = 'chat-input';
chatInput.placeholder = 'Envoyer un message...';

const sendButton = document.createElement('button');
sendButton.className = 'send-button';
sendButton.innerHTML = `
    <svg fill="none" height="24" viewBox="0 0 24 24" width="24"
        xmlns="http://www.w3.org/2000/svg">
        <g stroke="antiquewhite" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5">
            <path d="m7.4 6.32 8.49-2.83c3.81-1.27 5.88.81 4.62 4.62l-2.83 8.49c-1.9 5.71-5.02 5.71-6.92 0l-.84-2.52-2.52-.84c-5.71-1.9-5.71-5.01 0-6.92z"/>
            <path d="m10.11 13.65 3.58-3.59"/>
        </g>
    </svg>
`;

chatInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendButton.click();
    }
});

sendButton.addEventListener('click', () => {
    const corps = chatInput.value.trim();
    if (corps) {
        sendNewChat(corps, IDUser, IDSubject);
        chatInput.value = '';
    }
});

chatBox.appendChild(chatInput);
chatBox.appendChild(sendButton);

function createSingleChatBlock(IDChat, corps, date, username) {
    const singleChatBlock = document.createElement('div');
    singleChatBlock.className = 'single-chat-block';

    const chatUser = document.createElement('p');
    chatUser.textContent = username;
    singleChatBlock.appendChild(chatUser);

    const chatDate = document.createElement('p');
    chatDate.textContent = new Date(date).toLocaleString();
    singleChatBlock.appendChild(chatDate);

    const chatContent = document.createElement('p');
    chatContent.textContent = corps;
    singleChatBlock.appendChild(chatContent);

    allChatBlock.appendChild(singleChatBlock);
}


function loadAllChats(IDSubject) {
    fetch(`/get-chat/${IDSubject}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(res => res.json())
    .then(data => {
        data.sort((a, b) => new Date(a.date) - new Date(b.date));
        allChatBlock.innerHTML = '';
        data.forEach(chat => {
            createSingleChatBlock(chat.IDChat, chat.corps, chat.date, chat.username);
        });
        if (!contenu.contains(allChatBlock)) {
            contenu.appendChild(allChatBlock);
        }
        nbChats = data.length;
    })
    .catch(err => console.error('Erreur récupération chats :', err));
}

function sendNewChat(corps, IDUser, IDSubject) {
    fetch('/api/new-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ corps, IDUser, IDSubject })
    })
    .then(res => res.json())
    .then(data => {
        loadAllChats(IDSubject);
    })
    .catch(err => console.error('Erreur envoi chat :', err));
}

// Chargement initial
loadAllChats(IDSubject);

// Rafraîchissement périodique s’il y a de nouveaux messages
setInterval(() => {
    fetch(`/get-nb-chats/${IDSubject}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(res => res.json())
    .then(data => {
        if (data.nbchats !== nbChats) {
            loadAllChats(IDSubject);
        }
    });
}, 2000);

