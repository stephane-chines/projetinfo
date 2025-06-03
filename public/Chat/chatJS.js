// 📦 Récupération des infos utilisateur depuis le localStorage
const IDSubject = localStorage.getItem("selectedSubjectID");
const username = localStorage.getItem("username");
const IDUser = localStorage.getItem("IDUser");

// 🎯 Références DOM
const contenu = document.getElementById('contenu');
const QuestionsReponses = document.querySelector("#QR");
const Documents = document.querySelector("#Documents");
const RetourLobby = document.querySelector("#bouton-menu");

// ➡️ Navigation
QuestionsReponses.addEventListener("click", () => {
    window.location.href = "/QR";
});

Documents.addEventListener("click", () => {
    window.location.href = "/documents/documents.html";
});

RetourLobby.addEventListener("click", () => {
    window.location.href = "/Accueil/Accueil.html";
});

// 💬 Boîte de discussion
const allChatBlock = document.createElement('div');
allChatBlock.className = 'all-chat-block';

const chatBox = document.getElementById('chatbox');
chatBox.className = 'chatbox';

const chatInput = document.createElement('textarea');
chatInput.className = 'chat-input';
chatInput.placeholder = 'Envoyer un message...';

const sendButton = document.createElement('button');
sendButton.className = 'send-button';
sendButton.innerHTML = `<svg fill="none" height="24" width="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g stroke="antiquewhite" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="m7.4 6.32 8.49-2.83c3.81-1.27 5.88.81 4.62 4.62l-2.83 8.49c-1.9 5.71-5.02 5.71-6.92 0l-.84-2.52-2.52-.84c-5.71-1.9-5.71-5.01 0-6.92z"/><path d="m10.11 13.65 3.58-3.59"/></g></svg>`;

sendButton.addEventListener('click', async () => {
    const corps = chatInput.value.trim();
    if (corps) {
        await new_chat(corps, IDUser, IDSubject);
        chatInput.value = '';
    }
});

chatBox.appendChild(chatInput);
chatBox.appendChild(sendButton);

// ✅ Création d'un bloc de message
function createSingleChatBlock(IDChat, corps, date, username) {
    const singleChatBlock = document.createElement('div');
    singleChatBlock.className = 'single-chat-block';

    const chatUser = document.createElement('p');
    chatUser.textContent = username;
    chatUser.className = 'chat-username';

    const chatDate = document.createElement('p');
    chatDate.textContent = new Date(date).toLocaleString();
    chatDate.className = 'chat-date';

    const chatContent = document.createElement('p');
    chatContent.textContent = corps;
    chatContent.className = 'chat-corps';

    singleChatBlock.appendChild(chatUser);
    singleChatBlock.appendChild(chatDate);
    singleChatBlock.appendChild(chatContent);

    allChatBlock.appendChild(singleChatBlock);
}

// 🔁 Récupère tous les chats pour un sujet donné
async function get_all_chats(IDSubject) {
    if (contenu.contains(allChatBlock)) {
        contenu.removeChild(allChatBlock);
    }

    allChatBlock.innerHTML = '';
    try {
        const res = await fetch(`/get-chat/${IDSubject}`);
        const data = await res.json();
        data.sort((a, b) => new Date(a.date) - new Date(b.date));
        data.forEach(chat => {
            createSingleChatBlock(chat.IDChat, chat.corps, chat.date, chat.username);
        });
        contenu.appendChild(allChatBlock);
    } catch (error) {
        console.error("Erreur lors du chargement des messages :", error);
    }
}

// ➕ Nouveau message envoyé
async function new_chat(corps, IDUser, IDSubject) {
    try {
        const res = await fetch('/api/new-chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ corps, IDUser, IDSubject })
        });

        const data = await res.json();
        if (data.success) {
            createSingleChatBlock(data.IDChat, corps, data.date, username);
        } else {
            console.error('Erreur lors de la création du message :', data.message);
        }
    } catch (error) {
        console.error('Erreur de requête POST :', error);
    }

    // Recharge la liste pour éviter les doublons ou erreurs de synchro
    await get_all_chats(IDSubject);
}

// 📥 Initialisation : on charge les messages
get_all_chats(IDSubject);

// 🔄 Rafraîchissement automatique toutes les 2 secondes si changement
setInterval(async () => {
    try {
        const res = await fetch(`/get-nb-chats/${IDSubject}`);
        const data = await res.json();
        if (data.nbchats != allChatBlock.children.length) {
            await get_all_chats(IDSubject);
        }
    } catch (error) {
        console.error('Erreur lors du rafraîchissement :', error);
    }
}, 2000);
