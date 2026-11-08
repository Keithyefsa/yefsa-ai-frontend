
"use strict";

// ==========================================
// YEFSATECH - YEFSA AI
// Main frontend JavaScript
// ==========================================


// 1. CONNECT HTML ELEMENTS

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

// Optional developer menu button
const developerBtn =
    document.getElementById("chatDeveloperBtn") ||
    document.getElementById("developerBtn");


// 2. CONFIGURATION

const API_URL =
    "https://yefsa-ai-backend.onrender.com/chat";

const CONVERSATIONS_KEY =
    "yefsa_ai_conversations_v1";

const ACTIVE_CHAT_KEY =
    "yefsa_ai_active_chat_v1";

const LEGACY_KEY =
    "yefsa_ai_chat_v1";

const MEMORY_KEY =
    "yefsa_ai_memory_v1";

const WELCOME_MESSAGE =
    "Hello! I'm Yefsa AI. How can I help you today?";


// Stop safely if essential HTML elements are missing

if (!chatBox || !userInput || !sendBtn) {
    console.error(
        "Yefsa AI: Required chat HTML elements are missing."
    );
}


// 3. APPLICATION DATA

let conversations = [];
let activeChatId = null;


// 4. GENERATE UNIQUE CHAT ID

function makeId() {
    return Date.now().toString() +
        Math.random().toString(16).slice(2);
}


// 5. GET ACTIVE CONVERSATION

function getActiveChat() {
    return conversations.find(
        chat => chat.id === activeChatId
    );
}


// 6. LONG-TERM MEMORY

function loadMemories() {
    try {
        const saved = localStorage.getItem(MEMORY_KEY);

        const memories = saved
            ? JSON.parse(saved)
            : [];

        return Array.isArray(memories)
            ? memories.filter(
                item => typeof item === "string"
            )
            : [];

    } catch (error) {
        console.error("Memory loading error:", error);
        return [];
    }
}


function saveMemories(memories) {
    try {
        localStorage.setItem(
            MEMORY_KEY,
            JSON.stringify(memories)
        );

        return true;

    } catch (error) {
        console.error("Memory saving error:", error);
        return false;
    }
}


function addMemory(memory) {
    const cleanMemory = memory.trim();

    if (!cleanMemory) return false;

    const memories = loadMemories();

    const alreadyExists = memories.some(
        item =>
            item.toLowerCase() === cleanMemory.toLowerCase()
    );

    if (alreadyExists) return true;

    memories.push(cleanMemory);

    return saveMemories(memories);
}


// 7. SAVE CONVERSATIONS

function saveConversations() {
    try {
        localStorage.setItem(
            CONVERSATIONS_KEY,
            JSON.stringify(conversations)
        );

        if (activeChatId) {
            localStorage.setItem(
                ACTIVE_CHAT_KEY,
                activeChatId
            );
        } else {
            localStorage.removeItem(ACTIVE_CHAT_KEY);
        }

    } catch (error) {
        console.error("Conversation saving error:", error);
    }
}


// 8. SAVE ACTIVE CHAT

function saveActiveChat() {
    const chat = getActiveChat();

    if (!chat || !chatBox) return;

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
        item => item.sender === "user"
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


// 9. MESSAGE STYLING

function styleMessage(message, sender) {
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
}


// 10. ADD MESSAGE TO CHAT

function addMessage(text, sender, shouldSave = true) {
    if (!chatBox) return null;

    const message = document.createElement("div");

    message.classList.add("message", sender);
    message.textContent = String(text);

    styleMessage(message, sender);

    chatBox.appendChild(message);

    chatBox.scrollTop = chatBox.scrollHeight;

    if (shouldSave) {
        saveActiveChat();
    }

    return message;
}


// 11. DISPLAY ACTIVE CONVERSATION

function renderActiveChat() {
    const chat = getActiveChat();

    if (!chat || !chatBox) return;

    chatBox.innerHTML = "";

    chat.messages.forEach(item => {
        const sender =
            item.sender === "user" ? "user" : "bot";

        const message = document.createElement("div");

        message.classList.add("message", sender);
        message.textContent = String(item.text || "");

        styleMessage(message, sender);

        chatBox.appendChild(message);
    });

    chatBox.scrollTop = chatBox.scrollHeight;
}


// 12. CREATE NEW CHAT

function startNewChat() {
    const chat = {
        id: makeId(),
        title: "New Chat",
        updatedAt: Date.now(),
        customTitle: false,
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

    if (dropdownMenu) {
        dropdownMenu.hidden = true;
    }
}


// 13. LOAD PREVIOUS CONVERSATIONS

function loadConversations() {
    try {
        const saved = localStorage.getItem(
            CONVERSATIONS_KEY
        );

        if (saved) {
            const parsed = JSON.parse(saved);

            if (Array.isArray(parsed)) {
                conversations = parsed.filter(
                    chat =>
                        chat &&
                        typeof chat.id === "string" &&
                        Array.isArray(chat.messages)
                );
            }
        }

        // Migrate older saved conversation

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
                        messages: oldMessages,
                        customTitle: false
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
        console.error("Chat loading error:", error);

        conversations = [];
        activeChatId = null;

        startNewChat();
    }
}


// 14. SEND MESSAGE TO YEFSA AI

async function sendMessage() {

    if (!chatBox || !userInput || !sendBtn) {
        console.error("Chat interface is unavailable.");
        return;
    }

    const message = userInput.value.trim();

    if (!message || sendBtn.disabled) return;


    // Handle explicit memory requests

    const rememberMatch = message.match(
        /^remember that\s+(.+)/i
    );

    if (rememberMatch) {

        const memory = rememberMatch[1].trim();

        addMessage(message, "user");

        const saved = addMemory(memory);

        addMessage(
            saved
                ? "I've saved that memory on this device."
                : "I couldn't save that memory. Please try again.",
            "bot"
        );

        userInput.value = "";

        return;
    }


    // Collect previous conversation messages

    const activeChat = getActiveChat();

    const history = activeChat
        ? activeChat.messages
            .filter(item =>
                item.sender === "user" ||
                item.sender === "bot"
            )
            .filter(item =>
                item.text !== WELCOME_MESSAGE
            )
            .slice(-20)
            .map(item => ({
                role: item.sender === "user"
                    ? "user"
                    : "model",

                text: item.text
            }))
        : [];


    // Display user message

    addMessage(message, "user");

    userInput.value = "";

    sendBtn.disabled = true;


    // Display thinking indicator

    const thinking = addMessage(
        "Thinking...",
        "bot",
        false
    );

    thinking.classList.add("thinking");


    try {

        console.log("Sending request to:", API_URL);


        // Send request to Flask backend

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


        // Read backend response safely

        const responseText = await response.text();

        let data;

        try {
            data = JSON.parse(responseText);

        } catch (parseError) {
            throw new Error(
                "The server returned an invalid response. HTTP " +
                response.status
            );
        }


        console.log("Backend response:", data);


        // Check for backend errors

        if (!response.ok) {
            throw new Error(
                data.error ||
                "Server error. HTTP " + response.status
            );
        }


        // Check that the reply exists

        if (
            !data ||
            typeof data.reply !== "string" ||
            !data.reply.trim()
        ) {
            throw new Error(
                "The server responded but did not provide an AI reply."
            );
        }


        // Display AI response

        thinking.textContent = data.reply;

        thinking.classList.remove("thinking");

        styleMessage(thinking, "bot");

        saveActiveChat();


    } catch (error) {

        console.error("Yefsa AI error:", error);

        thinking.textContent =
            "Connection error: " + error.message;

        thinking.classList.remove("thinking");

        saveActiveChat();


    } finally {

        sendBtn.disabled = false;

        userInput.focus();

        chatBox.scrollTop = chatBox.scrollHeight;

    }

}


// 15. OPEN AND CLOSE MENU

if (menuBtn && dropdownMenu) {

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

}


// 16. NEW CHAT BUTTON

if (newChatBtn) {

    newChatBtn.addEventListener("click", function() {

        startNewChat();

    });

}


// 17. DELETE CURRENT CHAT

if (deleteChatBtn) {

    deleteChatBtn.addEventListener("click", function() {

        if (dropdownMenu) {
            dropdownMenu.hidden = true;
        }

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

            activeChatId = conversations[0].id;

            saveConversations();

            renderActiveChat();

        }

    });

}


// 18. DISPLAY CHAT HISTORY

function renderHistory() {

    if (!historyList) return;

    historyList.innerHTML = "";

    if (conversations.length === 0) {

        historyList.textContent =
            "No conversations yet.";

        return;
    }


    conversations.forEach(chat => {

        const row = document.createElement("div");

        row.className = "history-row";


        // Conversation button

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

            if (historyPanel) {
                historyPanel.hidden = true;
            }

        });


        // Rename conversation

        const renameBtn = document.createElement("button");

        renameBtn.className = "rename-chat-btn";

        renameBtn.type = "button";

        renameBtn.textContent = "✏️";


        renameBtn.addEventListener("click", function(event) {

            event.stopPropagation();

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


        // Delete conversation from history

        const deleteBtn = document.createElement("button");

        deleteBtn.className = "delete-chat-btn";

        deleteBtn.type = "button";

        deleteBtn.textContent = "🗑️";


        deleteBtn.addEventListener("click", function(event) {

            event.stopPropagation();

            const confirmed = confirm(
                "Permanently delete '" +
                chat.title +
                "'?"
            );

            if (!confirmed) return;

            conversations = conversations.filter(
                item => item.id !== chat.id
            );

            if (activeChatId === chat.id) {

                activeChatId = conversations.length > 0
                    ? conversations[0].id
                    : null;

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


// 19. OPEN CHAT HISTORY

if (historyBtn) {

    historyBtn.addEventListener("click", function() {

        if (dropdownMenu) {
            dropdownMenu.hidden = true;
        }

        renderHistory();

        if (historyPanel) {
            historyPanel.hidden = false;
        }

    });

}


// 20. CLOSE CHAT HISTORY

if (closeHistoryBtn && historyPanel) {

    closeHistoryBtn.addEventListener("click", function() {

        historyPanel.hidden = true;

    });

}


// 21. SUBSCRIBE OPTION

if (subscribeBtn) {

    subscribeBtn.addEventListener("click", function() {

        if (dropdownMenu) {
            dropdownMenu.hidden = true;
        }

        alert(
            "Yefsa AI subscriptions are under development. Stay tuned!"
        );

    });

}


// 22. CHAT WITH DEVELOPER OPTION

if (developerBtn) {

    developerBtn.addEventListener("click", function() {

        if (dropdownMenu) {
            dropdownMenu.hidden = true;
        }

        alert(
            "Welcome! You're connecting with the YefsaTech developer. This feature is under development."
        );

    });

}


// 23. SEND BUTTON

if (sendBtn) {

    sendBtn.addEventListener("click", sendMessage);

}


// 24. ENTER KEY

if (userInput) {

    userInput.addEventListener("keydown", function(event) {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            sendMessage();

        }

    });

}


// 25. START APPLICATION

loadConversations();


// 26. REGISTER SERVICE WORKER

if ("serviceWorker" in navigator) {

    window.addEventListener("load", function() {

        navigator.serviceWorker.register(
            "./service-worker.js"
        )

        .then(function() {

            console.log("YefsaTech is ready!");

        })

        .catch(function(error) {

            console.error(
                "Service worker error:",
                error
            );

        });

    });

}

// =====================================
// YEFSATECH HOME SCREEN AND NAVIGATION
// =====================================

(function () {
    "use strict";

    const homeScreen = document.getElementById("homeScreen");
    const chatScreen = document.getElementById("chatScreen");
    const bmyScreen = document.getElementById("bmyScreen");

    const welcomeGreeting = document.getElementById("welcomeGreeting");

    const openYefsaAiBtn = document.getElementById("openYefsaAiBtn");
    const openBmyBtn = document.getElementById("openBmyBtn");

    const backHomeFromChatBtn =
        document.getElementById("backHomeFromChatBtn");

    const backHomeFromBmyBtn =
        document.getElementById("backHomeFromBmyBtn");

    // Display greeting using the phone's local time
    function updateWelcomeGreeting() {
        if (!welcomeGreeting) return;

        const now = new Date();

        if (isNaN(now.getTime())) {
            welcomeGreeting.textContent = "Welcome";
            return;
        }

        const hour = now.getHours();

        if (hour >= 5 && hour < 12) {
            welcomeGreeting.textContent = "Good morning!";
        } else if (hour >= 12 && hour < 17) {
            welcomeGreeting.textContent = "Good afternoon!";
        } else {
            welcomeGreeting.textContent = "Good evening!";
        }
    }

    // Show a selected screen
    function showScreen(screen) {
        homeScreen.hidden = screen !== "home";
        chatScreen.hidden = screen !== "chat";
        bmyScreen.hidden = screen !== "bmy";

        // Close open chat menus when leaving chat
        if (screen !== "chat") {
            const dropdownMenu =
                document.getElementById("dropdownMenu");

            const historyPanel =
                document.getElementById("historyPanel");

            if (dropdownMenu) dropdownMenu.hidden = true;
            if (historyPanel) historyPanel.hidden = true;
        }

        window.scrollTo(0, 0);
    }

    // Open Yefsa AI
    if (openYefsaAiBtn) {
        openYefsaAiBtn.addEventListener("click", function () {
            showScreen("chat");
        });
    }

    
// Open BMY application
if (openBmyBtn) {
    openBmyBtn.addEventListener("click", function () {
        window.location.href =
            "https://keithyefsa.github.io/yefsa-ai-frontend/indexbmy.html";
    });
}

    // Return from Yefsa AI to home
    if (backHomeFromChatBtn) {
        backHomeFromChatBtn.addEventListener("click", function () {
            showScreen("home");
        });
    }

    // Return from BMY to home
    if (backHomeFromBmyBtn) {
        backHomeFromBmyBtn.addEventListener("click", function () {
            showScreen("home");
        });
    }

    // Initialize the home screen
    updateWelcomeGreeting();
    showScreen("home");

})();


