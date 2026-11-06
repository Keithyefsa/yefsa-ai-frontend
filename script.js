const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

const menuBtn = document.getElementById("menuBtn");
const dropdownMenu = document.getElementById("dropdownMenu");

const newChatBtn = document.getElementById("newChatBtn");
const deleteChatBtn = document.getElementById("deleteChatBtn");
const historyBtn = document.getElementById("historyBtn");
const subscribeBtn = document.getElementById("subscribeBtn");
const historyPanel = document.getElementById("historyPanel");
const historyList = document.getElementById("historyList");
const closeHistoryBtn = document.getElementById("closeHistoryBtn");
const API_URL = "https://yefsa-ai-backend.onrender.com/chat";

const CONVERSATIONS_KEY = "yefsa_ai_conversations_v1";
const ACTIVE_CHAT_KEY = "yefsa_ai_active_chat_v1";
const LEGACY_KEY = "yefsa_ai_chat_v1";
const MEMORY_KEY = "yefsa_ai_memory_v1";

// Load Yefsa AI's long-term memories
function loadMemories() {
    try {
        const saved = localStorage.getItem(MEMORY_KEY);
        const memories = saved ? JSON.parse(saved) : [];

        return Array.isArray(memories) ? memories : [];
    } catch (error) {
        console.error("Could not load memories:", error);
        return [];
    }
}

// Save Yefsa AI's long-term memories
function saveMemories(memories) {
    localStorage.setItem(
        MEMORY_KEY,
        JSON.stringify(memories)
    );
}

// Add a new memory without duplicating it
function addMemory(memory) {
    const memories = loadMemories();

    const cleanMemory = memory.trim();

    if (!cleanMemory) return;

    const alreadyExists = memories.some(
        item => item.toLowerCase() === cleanMemory.toLowerCase()
    );

    if (!alreadyExists) {
        memories.push(cleanMemory);
        saveMemories(memories);
    }
}

const WELCOME_MESSAGE =
    "Hello! I'm Yefsa AI. How can I help you today?";

let conversations = [];
let activeChatId = null;


// Generate a unique chat ID
function makeId() {
    return Date.now().toString() +
        Math.random().toString(16).slice(2);
}


// Get the currently open conversation
function getActiveChat() {
    return conversations.find(
        chat => chat.id === activeChatId
    );
}


// Save all conversations
function saveConversations() {
    try {
        localStorage.setItem(
            CONVERSATIONS_KEY,
            JSON.stringify(conversations)
        );

        localStorage.setItem(
            ACTIVE_CHAT_KEY,
            activeChatId
        );
    } catch (error) {
        console.error("Could not save chats:", error);
    }
}


// Save the currently displayed conversation
function saveActiveChat() {
    const chat = getActiveChat();

    if (!chat) return;

    chat.messages = Array.from(
        chatBox.querySelectorAll(".message")
    )
    .filter(message =>
        !message.classList.contains("thinking")
    )
    .map(message => ({
        text: message.textContent,
        sender: message.classList.contains("user")
            ? "user"
            : "bot"
    }));

    const firstUserMessage = chat.messages.find(
        message => message.sender === "user"
    );

    if (!chat.customTitle) {
    chat.title = firstUserMessage
        ? firstUserMessage.text.slice(0, 35)
        : "New Chat";
}

    chat.updatedAt = Date.now();

    conversations.sort(
        (a, b) => b.updatedAt - a.updatedAt
    );

    saveConversations();
}


// Display the active conversation
function renderActiveChat() {
    const chat = getActiveChat();

    if (!chat) return;

    chatBox.innerHTML = "";

    chat.messages.forEach(item => {
        const message = document.createElement("div");

        message.classList.add("message", item.sender);
        message.textContent = item.text;

        chatBox.appendChild(message);
    });

    chatBox.scrollTop = chatBox.scrollHeight;
}


// Create a new conversation
function startNewChat() {
    const chat = {
        id: makeId(),
        title: "New Chat",
        updatedAt: Date.now(),
        messages: [
            {
                text: WELCOME_MESSAGE,
                sender: "bot"
            }
        ]
    };

    conversations.unshift(chat);
    activeChatId = chat.id;

    saveConversations();
    renderActiveChat();

    dropdownMenu.hidden = true;
}


// Load previous conversations
function loadConversations() {
    try {
        const saved = localStorage.getItem(
            CONVERSATIONS_KEY
        );

        if (saved) {
            const parsed = JSON.parse(saved);

            if (Array.isArray(parsed) && parsed.length > 0) {
                conversations = parsed;
            }
        }

        // Migrate your old saved conversation
        if (conversations.length === 0) {
            const legacy = localStorage.getItem(LEGACY_KEY);

            if (legacy) {
                const oldMessages = JSON.parse(legacy);

                if (
                    Array.isArray(oldMessages) &&
                    oldMessages.length > 0
                ) {
                    conversations.push({
                        id: makeId(),
                        title: "Previous Chat",
                        updatedAt: Date.now(),
                        messages: oldMessages
                    });
                }
            }
        }

        if (conversations.length === 0) {
            startNewChat();
            return;
        }

        activeChatId = localStorage.getItem(
            ACTIVE_CHAT_KEY
        );

        if (!getActiveChat()) {
            activeChatId = conversations[0].id;
        }

        renderActiveChat();
        saveConversations();

    } catch (error) {
        console.error("Could not load chats:", error);
        startNewChat();
    }
}


// Add a message to the screen

function addMessage(text, sender, shouldSave = true) {
    const message = document.createElement("div");

    message.classList.add("message", sender);
    message.textContent = text;

    // Align AI messages left and user messages right
    message.style.display = "block";
    message.style.width = "fit-content";
    message.style.maxWidth = "90%";

    if (sender === "user") {
        message.style.marginLeft = "auto";
        message.style.marginRight = "0";
    } else {
        message.style.marginLeft = "0";
        message.style.marginRight = "auto";
    }

    chatBox.appendChild(message);
    chatBox.scrollTop = chatBox.scrollHeight;

    if (shouldSave) {
        saveActiveChat();
    }

    return message;
}



// Send a message to Yefsa AI

async function sendMessage() {
    const message = userInput.value.trim();

    if (!message || sendBtn.disabled) return;

    // Save an explicitly requested memory
    const rememberMatch = message.match(
        /^remember that\s+(.+)/i
    );

    if (rememberMatch) {
        const memory = rememberMatch[1].trim();

        addMessage(message, "user");
        addMemory(memory);

        addMessage(
            "Got it! I've saved that to my memory on this device.",
            "bot"
        );

        userInput.value = "";
        return;
    }

    // Get previous messages from the active conversation
    const activeChat = conversations.find(
        chat => chat.id === activeChatId
    );

    const history = activeChat
        ? activeChat.messages
            .filter(item =>
                item.sender === "user" || item.sender === "bot"
            )
            .filter(item => item.text !== WELCOME_MESSAGE)
            .slice(-20)
            .map(item => ({
                role: item.sender === "user" ? "user" : "model",
                text: item.text
            }))
        : [];

    addMessage(message, "user");

    userInput.value = "";
    sendBtn.disabled = true;

    const thinking = addMessage(
        "Thinking...",
        "bot",
        false
    );

    thinking.classList.add("thinking");

    try {
        const response = await fetch(API_URL, {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
    message: message,
    history: history,
    memories: loadMemories()
})
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || "Something went wrong."
            );
        }

        thinking.textContent = data.reply;
        thinking.classList.remove("thinking");

        saveActiveChat();

    } catch (error) {
        thinking.textContent =
            "Sorry, I couldn't connect. Please try again.";

        thinking.classList.remove("thinking");

        saveActiveChat();

        console.error(error);

    } finally {
        sendBtn.disabled = false;
        userInput.focus();
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

// Menu open and close
menuBtn.addEventListener("click", function(event) {
    event.stopPropagation();

    dropdownMenu.hidden = !dropdownMenu.hidden;
});


// Close menu when tapping outside
document.addEventListener("click", function(event) {
    if (
        !menuBtn.contains(event.target) &&
        !dropdownMenu.contains(event.target)
    ) {
        dropdownMenu.hidden = true;
    }
});


// New Chat option
newChatBtn.addEventListener("click", function() {
    startNewChat();
});


// Delete current conversation
deleteChatBtn.addEventListener("click", function() {
    dropdownMenu.hidden = true;

    const confirmed = confirm(
        "Delete this conversation?"
    );

    if (!confirmed) return;

    conversations = conversations.filter(
        chat => chat.id !== activeChatId
    );

    if (conversations.length === 0) {
        startNewChat();
    } else {
        conversations.sort(
            (a, b) => b.updatedAt - a.updatedAt
        );

        activeChatId = conversations[0].id;

        saveConversations();
        renderActiveChat();
    }

    alert("Conversation deleted.");
});


// Display Chat History
function renderHistory() {
    historyList.innerHTML = "";

    if (conversations.length === 0) {
        historyList.textContent = "No conversations yet.";
        return;
    }

    conversations.forEach(chat => {
        const row = document.createElement("div");
        row.className = "history-row";

        // Conversation card
        const item = document.createElement("button");
        item.className = "history-item";
        item.type = "button";

        const title = document.createElement("strong");
        title.textContent = chat.title || "New Chat";

        const date = document.createElement("small");
        date.textContent = new Date(
            chat.updatedAt
        ).toLocaleString();

        item.appendChild(title);
        item.appendChild(date);

        item.addEventListener("click", function() {
            activeChatId = chat.id;
            saveConversations();
            renderActiveChat();
            historyPanel.hidden = true;
        });

        // Rename button
        const renameBtn = document.createElement("button");
        renameBtn.className = "rename-chat-btn";
        renameBtn.type = "button";
        renameBtn.textContent = "✏️";

        renameBtn.addEventListener("click", function() {
            const newTitle = prompt(
                "Enter a new conversation name:",
                chat.title
            );

            if (!newTitle || !newTitle.trim()) return;

            chat.title = newTitle.trim();
            chat.customTitle = true;
            chat.updatedAt = Date.now();

            saveConversations();
            renderHistory();
        });

        // Delete button
        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-chat-btn";
        deleteBtn.type = "button";
        deleteBtn.textContent = "🗑️";

        deleteBtn.addEventListener("click", function() {
            const confirmed = confirm(
                "Permanently delete '" + chat.title + "'?"
            );

            if (!confirmed) return;

            conversations = conversations.filter(
                item => item.id !== chat.id
            );

            if (activeChatId === chat.id) {
                if (conversations.length > 0) {
                    activeChatId = conversations[0].id;
                } else {
                    activeChatId = null;
                }
            }

            if (!activeChatId) {
                startNewChat();
            } else {
                saveConversations();
                renderActiveChat();
            }

            renderHistory();
        });

        row.appendChild(item);
        row.appendChild(renameBtn);
        row.appendChild(deleteBtn);

        historyList.appendChild(row);
    });
}


// Open Chat History
historyBtn.addEventListener("click", function() {
    dropdownMenu.hidden = true;

    renderHistory();
    historyPanel.hidden = false;
});


// Close Chat History
closeHistoryBtn.addEventListener("click", function() {
    historyPanel.hidden = true;
});


// Subscribe option
subscribeBtn.addEventListener("click", function() {
    dropdownMenu.hidden = true;

    alert(
        "Yefsa AI subscriptions are under development. Stay tuned!"
    );
});


// Send button
sendBtn.addEventListener("click", sendMessage);


// Enter key
userInput.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        sendMessage();
    }
});


// Load saved conversations when app opens
loadConversations();


// Register service worker
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./service-worker.js")
            .then(() => console.log("YefsaTech is ready!"))
            .catch(error => console.error(
                "Service worker error:", error
            ));
    });
}
