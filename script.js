
"use strict";

// ==========================================
// YEFSATECH - YEFSA AI
// Main frontend JavaScript
// Connected to BMY Business AI
// ==========================================


// ==========================================
// 1. CONNECT HTML ELEMENTS
// ==========================================

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

const developerBtn =
    document.getElementById("chatDeveloperBtn") ||
    document.getElementById("developerBtn");


// ==========================================
// 2. CONFIGURATION
// ==========================================

const API_BASE_URL =
    "https://yefsa-ai-backend.onrender.com";

const API_URL =
    `${API_BASE_URL}/chat`;

const MEMORY_API_URL =
    `${API_BASE_URL}/memory`;

const BMY_AI_URL =
    `${API_BASE_URL}/bmy/business`;

const BMY_TOKEN_KEY =
    "bmy_auth_token";

const BMY_BUSINESS_KEY =
    "bmy_selected_business";

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

const MAX_HISTORY_MESSAGES = 12;


// ==========================================
// 3. APPLICATION DATA
// ==========================================

let conversations = [];
let activeChatId = null;


// ==========================================
// 4. GENERATE UNIQUE CHAT ID
// ==========================================

function makeId() {

    return Date.now().toString() +
        Math.random().toString(16).slice(2);

}


// ==========================================
// 5. GET ACTIVE CONVERSATION
// ==========================================

function getActiveChat() {

    return conversations.find(
        chat => chat.id === activeChatId
    );

}


// ==========================================
// 6. BMY AUTHENTICATION
// ==========================================

function getBmyToken() {

    try {

        return sessionStorage.getItem(
            BMY_TOKEN_KEY
        );

    } catch (error) {

        console.error(
            "BMY token access error:",
            error
        );

        return null;

    }

}


// GET THE CURRENTLY SELECTED BUSINESS

function getSelectedBmyBusinessId() {

    try {

        const savedBusiness =
            sessionStorage.getItem(BMY_BUSINESS_KEY);

        if (!savedBusiness) {
            return null;
        }

        let business = savedBusiness;

        try {

            business = JSON.parse(savedBusiness);

        } catch (error) {

            // It may already be a plain business ID.

        }

        if (
            typeof business === "number" ||
            typeof business === "string"
        ) {

            const id = String(business).trim();

            return /^\d+$/.test(id) ? id : null;

        }

        if (
            business &&
            typeof business === "object"
        ) {

            const possibleId =
                business.id ??
                business.business_id ??
                business.businessId;

            if (
                possibleId !== undefined &&
                possibleId !== null
            ) {

                const id = String(possibleId).trim();

                return /^\d+$/.test(id) ? id : null;

            }

        }

        return null;

    } catch (error) {

        console.error(
            "BMY business selection error:",
            error
        );

        return null;

    }

}


// DETECT WHETHER THE USER IS USING BMY

function getBmySession() {

    const token = getBmyToken();

    if (!token) {

        return {
            active: false,
            token: null,
            businessId: null
        };

    }

    return {
        active: true,
        token: token,
        businessId: getSelectedBmyBusinessId()
    };

}


// ==========================================
// 7. LONG-TERM MEMORY
// ==========================================

function loadMemories() {

    try {

        const saved = localStorage.getItem(
            MEMORY_KEY
        );

        const memories = saved
            ? JSON.parse(saved)
            : [];

        return Array.isArray(memories)
            ? memories.filter(
                item => typeof item === "string"
            )
            : [];

    } catch (error) {

        console.error(
            "Memory loading error:",
            error
        );

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

        console.error(
            "Memory saving error:",
            error
        );

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


// ==========================================
// 8. SAVE CONVERSATIONS
// ==========================================

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

            localStorage.removeItem(
                ACTIVE_CHAT_KEY
            );

        }

    } catch (error) {

        console.error(
            "Conversation saving error:",
            error
        );

    }

}


// ==========================================
// 9. MARKDOWN MESSAGE RENDERER
// ==========================================

function renderFormattedMessage(container, text) {

    const rawText = String(text || "");

    container.dataset.rawText = rawText;

    container.replaceChildren();

    function addInlineFormatting(parent, content) {

        const pattern =
            /(\*\*[\s\S]+?\*\*|__[\s\S]+?__|(?<!\*)\*[^*\n]+\*|(?<!_)_[^_\n]+_|`[^`\n]+`)/g;

        let lastIndex = 0;
        let match;

        while ((match = pattern.exec(content)) !== null) {

            parent.appendChild(
                document.createTextNode(
                    content.slice(lastIndex, match.index)
                )
            );

            const token = match[0];

            let element;

            if (
                token.startsWith("**") ||
                token.startsWith("__")
            ) {

                element = document.createElement("strong");

            } else if (token.startsWith("`")) {

                element = document.createElement("code");

            } else {

                element = document.createElement("em");

            }

            element.textContent = token.replace(
                /^(\*\*|__|\*|_|`)|(\*\*|__|\*|_|`)$/g,
                ""
            );

            parent.appendChild(element);

            lastIndex = pattern.lastIndex;

        }

        parent.appendChild(
            document.createTextNode(
                content.slice(lastIndex)
            )
        );

    }


    const lines = rawText.split("\n");

    let currentList = null;
    let codeBlock = false;
    let codeContent = [];

    function closeList() {

        currentList = null;

    }


    function addCodeBlock() {

        const pre = document.createElement("pre");
        const code = document.createElement("code");

        code.textContent = codeContent.join("\n");

        pre.appendChild(code);

        container.appendChild(pre);

        codeContent = [];

    }


    lines.forEach(line => {

        // CODE BLOCKS

        if (line.trim().startsWith("```")) {

            closeList();

            if (!codeBlock) {

                codeBlock = true;
                codeContent = [];

            } else {

                addCodeBlock();

                codeBlock = false;

            }

            return;

        }


        if (codeBlock) {

            codeContent.push(line);

            return;

        }


        // EMPTY LINES

        if (!line.trim()) {

            closeList();

            return;

        }


        // HEADINGS

        const headingMatch = line.match(
            /^(#{1,3})\s+(.+)$/
        );

        if (headingMatch) {

            closeList();

            const heading = document.createElement(
                "h" + headingMatch[1].length
            );

            addInlineFormatting(
                heading,
                headingMatch[2]
            );

            container.appendChild(heading);

            return;

        }


        // HORIZONTAL DIVIDER

        if (/^\s*([-*_])\1{2,}\s*$/.test(line)) {

            closeList();

            container.appendChild(
                document.createElement("hr")
            );

            return;

        }


        // BULLET AND NUMBERED LISTS

        const listMatch = line.match(
            /^(\s*)([-*+]|\d+\.)\s+(.+)$/
        );

        if (listMatch) {

            const ordered = /^\d+\./.test(
                listMatch[2]
            );

            const listType = ordered ? "ol" : "ul";

            if (
                !currentList ||
                currentList.tagName.toLowerCase() !== listType
            ) {

                closeList();

                currentList = document.createElement(
                    listType
                );

                container.appendChild(currentList);

            }

            const item = document.createElement("li");

            addInlineFormatting(
                item,
                listMatch[3]
            );

            currentList.appendChild(item);

            return;

        }


        closeList();


        // NORMAL PARAGRAPHS

        const paragraph = document.createElement("p");

        addInlineFormatting(
            paragraph,
            line
        );

        container.appendChild(paragraph);

    });


    // CLOSE AN UNFINISHED CODE BLOCK

    if (codeBlock) {

        addCodeBlock();

    }

}


// ==========================================
// 10. MESSAGE STYLING
// ==========================================

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


// ==========================================
// 11. ADD MESSAGE TO CHAT
// ==========================================

function addMessage(text, sender, shouldSave = true) {

    if (!chatBox) return null;

    const message = document.createElement("div");

    message.classList.add("message", sender);

    if (sender === "bot") {

        renderFormattedMessage(message, text);

    } else {

        message.textContent = String(text);

        message.dataset.rawText = String(text);

    }

    styleMessage(message, sender);

    chatBox.appendChild(message);

    chatBox.scrollTop = chatBox.scrollHeight;

    if (shouldSave) {

        saveActiveChat();

    }

    return message;

}


// ==========================================
// 12. SAVE ACTIVE CHAT
// ==========================================

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

        text:
            message.dataset.rawText ||
            message.textContent,

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


// ==========================================
// 13. DISPLAY ACTIVE CONVERSATION
// ==========================================

function renderActiveChat() {

    const chat = getActiveChat();

    if (!chat || !chatBox) return;

    chatBox.innerHTML = "";

    chat.messages.forEach(item => {

        const sender =
            item.sender === "user" ? "user" : "bot";

        const message = document.createElement("div");

        message.classList.add("message", sender);

        if (sender === "bot") {

            renderFormattedMessage(
                message,
                item.text || ""
            );

        } else {

            message.textContent = String(
                item.text || ""
            );

            message.dataset.rawText = String(
                item.text || ""
            );

        }

        styleMessage(message, sender);

        chatBox.appendChild(message);

    });

    chatBox.scrollTop = chatBox.scrollHeight;

}


// ==========================================
// 14. CREATE NEW CHAT
// ==========================================

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
        ],

        // Business association is assigned
        // when the first message is sent.
        bmyBusinessId: null

    };

    conversations.unshift(chat);

    activeChatId = chat.id;

    saveConversations();

    renderActiveChat();

    if (dropdownMenu) {

        dropdownMenu.hidden = true;

    }

}


// ==========================================
// 15. LOAD PREVIOUS CONVERSATIONS
// ==========================================

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


        // MIGRATE OLDER CONVERSATION

        if (conversations.length === 0) {

            const legacy = localStorage.getItem(
                LEGACY_KEY
            );

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

                        customTitle: false,

                        bmyBusinessId: null

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

        console.error(
            "Chat loading error:",
            error
        );

        conversations = [];

        activeChatId = null;

        startNewChat();

    }

}


// ==========================================
// 16. SAVE MEMORY
// ==========================================

async function rememberInformation(memory) {

    const cleanMemory = memory.trim();

    if (!cleanMemory) {

        throw new Error(
            "Memory cannot be empty."
        );

    }

    const token = getBmyToken();


    // AUTHENTICATED ACCOUNT

    if (token) {

        const response = await fetch(
            MEMORY_API_URL,
            {

                method: "POST",

                headers: {

                    "Content-Type": "application/json",

                    "Authorization": "Bearer " + token

                },

                body: JSON.stringify({

                    memory: cleanMemory

                })

            }
        );


        const responseText = await response.text();

        let data;

        try {

            data = JSON.parse(responseText);

        } catch (error) {

            throw new Error(
                "The memory server returned an invalid response."
            );

        }


        if (!response.ok) {

            throw new Error(
                data.error ||
                data.message ||
                "Memory saving failed."
            );

        }

        return "account";

    }


    // GUEST ACCOUNT

    const saved = addMemory(cleanMemory);

    if (!saved) {

        throw new Error(
            "Memory could not be saved on this device."
        );

    }

    return "device";

}


// ==========================================
// 17. PREPARE CONVERSATION HISTORY
// ==========================================

// NORMAL YEFSA AI HISTORY FORMAT

function getNormalHistory(chat) {

    if (!chat || !Array.isArray(chat.messages)) {
        return [];
    }

    return chat.messages

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

        }));

}


// BMY BUSINESS AI HISTORY FORMAT

function getBmyHistory(chat, businessId) {

    if (!chat || !Array.isArray(chat.messages)) {
        return [];
    }

    // Never transfer conversation history
    // between different businesses.

    if (
        chat.bmyBusinessId &&
        String(chat.bmyBusinessId) !== String(businessId)
    ) {

        return [];

    }

    return chat.messages

        .filter(item =>
            item.sender === "user" ||
            item.sender === "bot"
        )

        .filter(item =>
            item.text !== WELCOME_MESSAGE
        )

        .slice(-MAX_HISTORY_MESSAGES)

        .map(item => ({

            role: item.sender === "user"
                ? "user"
                : "assistant",

            content: String(item.text || "").slice(0, 4000)

        }));

}


// ==========================================
// 18. READ SERVER RESPONSE
// ==========================================

async function readApiResponse(response) {

    const responseText = await response.text();

    let data;

    try {

        data = JSON.parse(responseText);

    } catch (error) {

        throw new Error(
            "The server returned an invalid response. HTTP " +
            response.status
        );

    }


    if (!response.ok) {

        throw new Error(
            data.message ||
            data.error ||
            "Server error. HTTP " + response.status
        );

    }


    if (
        !data ||
        typeof data.reply !== "string" ||
        !data.reply.trim()
    ) {

        throw new Error(
            "The server responded but did not provide an AI reply."
        );

    }

    return data;

}


// ==========================================
// 19. SEND MESSAGE TO NORMAL YEFSA AI
// ==========================================

async function sendToNormalYefsaAI(message, chat) {

    const history = getNormalHistory(chat);

    const requestBody = {

        message: message,

        history: history,

        memories: loadMemories()

    };


    const response = await fetch(
        API_URL,
        {

            method: "POST",

            headers: {

                "Content-Type": "application/json"

            },

            body: JSON.stringify(requestBody)

        }
    );


    return await readApiResponse(response);

}


// ==========================================
// 20. SEND MESSAGE TO BMY BUSINESS AI
// ==========================================

async function sendToBmyAI(message, chat, session) {

    if (!session.token) {

        throw new Error(
            "Your BMY login session is missing. Please log in again."
        );

    }

    if (!session.businessId) {

        throw new Error(
            "BMY is connected, but no business is selected. Open BMY and select a business first."
        );

    }


    const businessId = session.businessId;

    const history = getBmyHistory(
        chat,
        businessId
    );


    const endpoint =
        `${BMY_AI_URL}/${encodeURIComponent(businessId)}/ai/chat`;


    console.log(
        "Sending message to BMY Business AI:",
        endpoint
    );


    const response = await fetch(
        endpoint,
        {

            method: "POST",

            headers: {

                "Content-Type": "application/json",

                "Authorization": "Bearer " + session.token

            },

            body: JSON.stringify({

                message: message,

                history: history

            })

        }
    );


    const data = await readApiResponse(response);


    // Remember which business owns this conversation.

    chat.bmyBusinessId = businessId;

    return data;

}


// ==========================================
// 21. SEND MESSAGE TO YEFSA AI
// ==========================================

async function sendMessage() {

    if (!chatBox || !userInput || !sendBtn) {

        console.error(
            "Chat interface is unavailable."
        );

        return;

    }

    const message = userInput.value.trim();

    if (!message || sendBtn.disabled) return;


    // HANDLE EXPLICIT MEMORY REQUESTS

    const rememberMatch = message.match(
        /^remember that\s+(.+)/i
    );

    if (rememberMatch) {

        const memory = rememberMatch[1].trim();

        addMessage(message, "user");

        userInput.value = "";

        sendBtn.disabled = true;

        try {

            const storageType = await rememberInformation(
                memory
            );

            if (storageType === "account") {

                addMessage(
                    "I've saved that memory to your account.",
                    "bot"
                );

            } else {

                addMessage(
                    "I've saved that memory on this device.",
                    "bot"
                );

            }

        } catch (error) {

            console.error(
                "Memory saving error:",
                error
            );

            addMessage(
                "I couldn't save that memory: " +
                error.message,
                "bot"
            );

        } finally {

            sendBtn.disabled = false;

            userInput.focus();

        }

        return;

    }


    const activeChat = getActiveChat();

    const bmySession = getBmySession();


    // DISPLAY USER MESSAGE

    addMessage(message, "user");

    userInput.value = "";

    sendBtn.disabled = true;


    // DISPLAY THINKING INDICATOR

    const thinking = addMessage(
        "Thinking...",
        "bot",
        false
    );

    if (thinking) {

        thinking.classList.add("thinking");

    }


    try {

        let data;


        // BMY SESSION ACTIVE

        if (bmySession.active) {

            data = await sendToBmyAI(
                message,
                activeChat,
                bmySession
            );


            // Mark this conversation as belonging
            // to the selected BMY business.

            activeChat.bmyBusinessId =
                bmySession.businessId;

        } else {

            // NORMAL YEFSA AI

            data = await sendToNormalYefsaAI(
                message,
                activeChat
            );

        }


        // DISPLAY AI RESPONSE

        renderFormattedMessage(
            thinking,
            data.reply
        );

        thinking.classList.remove("thinking");

        styleMessage(thinking, "bot");

        saveActiveChat();


    } catch (error) {

        console.error(
            "Yefsa AI error:",
            error
        );

        let errorMessage =
            "Connection error: " + error.message;


        if (
            error.message &&
            error.message.toLowerCase().includes("login session")
        ) {

            errorMessage =
                "Your BMY login session may have expired. Please log in to BMY again.";

        }


        thinking.textContent = errorMessage;

        thinking.dataset.rawText = errorMessage;

        thinking.classList.remove("thinking");

        saveActiveChat();


    } finally {

        sendBtn.disabled = false;

        userInput.focus();

        chatBox.scrollTop = chatBox.scrollHeight;

    }

}


// ==========================================
// 22. OPEN AND CLOSE MENU
// ==========================================

if (menuBtn && dropdownMenu) {

    menuBtn.addEventListener(
        "click",
        function(event) {

            event.stopPropagation();

            dropdownMenu.hidden = !dropdownMenu.hidden;

        }
    );


    document.addEventListener(
        "click",
        function(event) {

            if (
                !menuBtn.contains(event.target) &&
                !dropdownMenu.contains(event.target)
            ) {

                dropdownMenu.hidden = true;

            }

        }
    );

}


// ==========================================
// 23. NEW CHAT BUTTON
// ==========================================

if (newChatBtn) {

    newChatBtn.addEventListener(
        "click",
        function() {

            startNewChat();

        }
    );

}


// ==========================================
// 24. DELETE CURRENT CHAT
// ==========================================

if (deleteChatBtn) {

    deleteChatBtn.addEventListener(
        "click",
        function() {

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

        }
    );

}


// ==========================================
// 25. DISPLAY CHAT HISTORY
// ==========================================

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


        // CONVERSATION BUTTON

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


        item.addEventListener(
            "click",
            function() {

                activeChatId = chat.id;

                saveConversations();

                renderActiveChat();

                if (historyPanel) {

                    historyPanel.hidden = true;

                }

            }
        );


        // RENAME CONVERSATION

        const renameBtn = document.createElement("button");

        renameBtn.className = "rename-chat-btn";

        renameBtn.type = "button";

        renameBtn.textContent = "✏️";


        renameBtn.addEventListener(
            "click",
            function(event) {

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

            }
        );


        // DELETE CONVERSATION FROM HISTORY

        const deleteBtn = document.createElement("button");

        deleteBtn.className = "delete-chat-btn";

        deleteBtn.type = "button";

        deleteBtn.textContent = "🗑️";


        deleteBtn.addEventListener(
            "click",
            function(event) {

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

            }
        );


        row.appendChild(item);

        row.appendChild(renameBtn);

        row.appendChild(deleteBtn);

        historyList.appendChild(row);

    });

}


// ==========================================
// 26. OPEN CHAT HISTORY
// ==========================================

if (historyBtn) {

    historyBtn.addEventListener(
        "click",
        function() {

            if (dropdownMenu) {

                dropdownMenu.hidden = true;

            }

            renderHistory();

            if (historyPanel) {

                historyPanel.hidden = false;

            }

        }
    );

}


// ==========================================
// 27. CLOSE CHAT HISTORY
// ==========================================

if (closeHistoryBtn && historyPanel) {

    closeHistoryBtn.addEventListener(
        "click",
        function() {

            historyPanel.hidden = true;

        }
    );

}


// ==========================================
// 28. SUBSCRIBE OPTION
// ==========================================

if (subscribeBtn) {

    subscribeBtn.addEventListener(
        "click",
        function() {

            if (dropdownMenu) {

                dropdownMenu.hidden = true;

            }

            alert(
                "Yefsa AI subscriptions are under development. Stay tuned!"
            );

        }
    );

}


// ==========================================
// 29. CHAT WITH DEVELOPER OPTION
// ==========================================

if (developerBtn) {

    developerBtn.addEventListener(
        "click",
        function() {

            if (dropdownMenu) {

                dropdownMenu.hidden = true;

            }

            alert(
                "Welcome! You're connecting with the YefsaTech developer. This feature is under development."
            );

        }
    );

}


// ==========================================
// 30. SEND BUTTON
// ==========================================

if (sendBtn) {

    sendBtn.addEventListener(
        "click",
        sendMessage
    );

}


// ==========================================
// 31. ENTER KEY
// ==========================================

if (userInput) {

    userInput.addEventListener(
        "keydown",
        function(event) {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                sendMessage();

            }

        }
    );

}


// ==========================================
// 32. START APPLICATION
// ==========================================

loadConversations();


// ==========================================
// 33. REGISTER SERVICE WORKER
// ==========================================

if ("serviceWorker" in navigator) {

    window.addEventListener(
        "load",
        function() {

            navigator.serviceWorker.register(
                "./service-worker.js"
            )

            .then(function() {

                console.log(
                    "YefsaTech is ready!"
                );

            })

            .catch(function(error) {

                console.error(
                    "Service worker error:",
                    error
                );

            });

        }
    );

}


// ==========================================
// YEFSATECH HOME SCREEN AND NAVIGATION
// ==========================================

(function () {

    "use strict";

    const homeScreen =
        document.getElementById("homeScreen");

    const chatScreen =
        document.getElementById("chatScreen");

    const bmyScreen =
        document.getElementById("bmyScreen");

    const welcomeGreeting =
        document.getElementById("welcomeGreeting");

    const openYefsaAiBtn =
        document.getElementById("openYefsaAiBtn");

    const openBmyBtn =
        document.getElementById("openBmyBtn");

    const backHomeFromChatBtn =
        document.getElementById("backHomeFromChatBtn");

    const backHomeFromBmyBtn =
        document.getElementById("backHomeFromBmyBtn");


    // DISPLAY GREETING USING LOCAL TIME

    function updateWelcomeGreeting() {

        if (!welcomeGreeting) return;

        const now = new Date();

        if (isNaN(now.getTime())) {

            welcomeGreeting.textContent = "Welcome";

            return;

        }

        const hour = now.getHours();

        if (hour >= 5 && hour < 12) {

            welcomeGreeting.textContent =
                "Good morning!";

        } else if (hour >= 12 && hour < 17) {

            welcomeGreeting.textContent =
                "Good afternoon!";

        } else {

            welcomeGreeting.textContent =
                "Good evening!";

        }

    }


    // SHOW A SELECTED SCREEN

    function showScreen(screen) {

        if (homeScreen) {

            homeScreen.hidden = screen !== "home";

        }

        if (chatScreen) {

            chatScreen.hidden = screen !== "chat";

        }

        if (bmyScreen) {

            bmyScreen.hidden = screen !== "bmy";

        }


        // CLOSE CHAT MENUS WHEN LEAVING CHAT

        if (screen !== "chat") {

            const menu =
                document.getElementById("dropdownMenu");

            const history =
                document.getElementById("historyPanel");

            if (menu) {

                menu.hidden = true;

            }

            if (history) {

                history.hidden = true;

            }

        }

        window.scrollTo(0, 0);

    }


    // OPEN YEFSA AI

    if (openYefsaAiBtn) {

        openYefsaAiBtn.addEventListener(
            "click",
            function() {

                showScreen("chat");

            }
        );

    }


    // OPEN BMY APPLICATION

    if (openBmyBtn) {

        openBmyBtn.addEventListener(
            "click",
            function() {

                window.location.href =
                    "https://keithyefsa.github.io/yefsa-ai-frontend/indexbmy.html";

            }
        );

    }


    // RETURN FROM YEFSA AI TO HOME

    if (backHomeFromChatBtn) {

        backHomeFromChatBtn.addEventListener(
            "click",
            function() {

                showScreen("home");

            }
        );

    }


    // RETURN FROM BMY TO HOME

    if (backHomeFromBmyBtn) {

        backHomeFromBmyBtn.addEventListener(
            "click",
            function() {

                showScreen("home");

            }
        );

    }


    // INITIALIZE HOME SCREEN

    updateWelcomeGreeting();

    showScreen("home");

})();
