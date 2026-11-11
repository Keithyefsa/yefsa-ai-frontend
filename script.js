
"use strict";

// ==========================================
// YEFSATECH - YEFSA AI
// Main frontend JavaScript
// Integrated with BMY Business AI
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
// 2. API CONFIGURATION
// ==========================================

const API_BASE_URL =
    "https://yefsa-ai-backend.onrender.com";

const API_URL = `${API_BASE_URL}/chat`;

const MEMORY_API_URL =
    `${API_BASE_URL}/memory`;

const BMY_CHAT_URL =
    `${API_BASE_URL}/bmy/business`;

const BMY_TOKEN_KEY = "bmy_auth_token";

const BMY_BUSINESSES_KEY = "bmy_businesses";

const BMY_SELECTED_BUSINESS_KEY =
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


// ==========================================
// 3. APPLICATION DATA
// ==========================================

let conversations = [];
let activeChatId = null;


// ==========================================
// 4. UNIQUE CHAT ID
// ==========================================

function makeId() {

    return (
        Date.now().toString() +
        Math.random().toString(16).slice(2)
    );

}


// ==========================================
// 5. ACTIVE CONVERSATION
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


// ==========================================
// 7. GET SELECTED BMY BUSINESS
// ==========================================

function getSelectedBmyBusiness() {

    try {

        const savedBusiness =
            sessionStorage.getItem(
                BMY_SELECTED_BUSINESS_KEY
            );

        if (!savedBusiness) {
            return null;
        }

        const business = JSON.parse(
            savedBusiness
        );

        if (
            !business ||
            typeof business !== "object"
        ) {
            return null;
        }

        // Support the business object structures
        // used by the BMY frontend.

        const businessId =
            business.id ??
            business.business_id ??
            business.businessId;

        if (
            businessId === undefined ||
            businessId === null ||
            !Number.isInteger(Number(businessId)) ||
            Number(businessId) <= 0
        ) {
            return null;
        }

        return {
            ...business,
            id: Number(businessId)
        };

    } catch (error) {

        console.error(
            "Selected business loading error:",
            error
        );

        return null;

    }

}


// ==========================================
// 8. DETECT BMY AI SESSION
// ==========================================

function getBmySession() {

    const token = getBmyToken();

    if (!token) {
        return null;
    }

    const business = getSelectedBmyBusiness();

    if (!business) {

        return {
            authenticated: true,
            business: null,
            token
        };

    }

    return {
        authenticated: true,
        business,
        token
    };

}


// ==========================================
// 9. LONG-TERM MEMORY
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

    if (!cleanMemory) {
        return false;
    }

    const memories = loadMemories();

    const alreadyExists = memories.some(
        item =>
            item.toLowerCase() ===
            cleanMemory.toLowerCase()
    );

    if (alreadyExists) {
        return true;
    }

    memories.push(cleanMemory);

    return saveMemories(memories);

}


// ==========================================
// 10. SAVE CONVERSATIONS
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
// 11. MARKDOWN MESSAGE RENDERER
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

        while (
            (match = pattern.exec(content)) !== null
        ) {

            parent.appendChild(
                document.createTextNode(
                    content.slice(
                        lastIndex,
                        match.index
                    )
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


        // LISTS

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


        // NORMAL PARAGRAPH

        const paragraph = document.createElement("p");

        addInlineFormatting(
            paragraph,
            line
        );

        container.appendChild(paragraph);

    });


    if (codeBlock) {
        addCodeBlock();
    }

}


// ==========================================
// 12. MESSAGE STYLING
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
// 13. ADD MESSAGE
// ==========================================

function addMessage(
    text,
    sender,
    shouldSave = true
) {

    if (!chatBox) {
        return null;
    }

    const message = document.createElement("div");

    message.classList.add("message", sender);

    if (sender === "bot") {

        renderFormattedMessage(
            message,
            text
        );

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
// 14. SAVE ACTIVE CHAT
// ==========================================

function saveActiveChat() {

    const chat = getActiveChat();

    if (!chat || !chatBox) {
        return;
    }

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
// 15. DISPLAY ACTIVE CONVERSATION
// ==========================================

function renderActiveChat() {

    const chat = getActiveChat();

    if (!chat || !chatBox) {
        return;
    }

    chatBox.innerHTML = "";

    chat.messages.forEach(item => {

        const sender =
            item.sender === "user"
                ? "user"
                : "bot";

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
// 16. CREATE NEW CHAT
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


// ==========================================
// 17. LOAD CONVERSATIONS
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


        // MIGRATE OLD CONVERSATIONS

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
// 18. SAVE MEMORY
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


    // GUEST MEMORY

    const saved = addMemory(cleanMemory);

    if (!saved) {

        throw new Error(
            "Memory could not be saved on this device."
        );

    }

    return "device";

}


// ==========================================
// 19. DETECT BUSINESS REVIEW REQUEST
// ==========================================

function isBusinessReviewRequest(message) {

    const text = message.toLowerCase();

    const patterns = [

        /\breview my business\b/,
        /\breview (the )?business performance\b/,
        /\bbusiness performance review\b/,
        /\banaly[sz]e my business\b/,
        /\banaly[sz]e business performance\b/,
        /\bfull business review\b/,
        /\bcomprehensive business review\b/,
        /\bgive me a business review\b/,
        /\bhow is my business performing\b/,
        /\bhow is the business performing\b/,
        /\bprepare a business performance review\b/

    ];

    return patterns.some(
        pattern => pattern.test(text)
    );

}


// ==========================================
// 20. PREPARE CONVERSATION HISTORY
// ==========================================

function getConversationHistory() {

    const activeChat = getActiveChat();

    if (!activeChat) {
        return [];
    }

    return activeChat.messages

        .filter(item =>
            item.sender === "user" ||
            item.sender === "bot"
        )

        .filter(item =>
            item.text !== WELCOME_MESSAGE
        )

        .slice(-12)

        .map(item => ({

            role: item.sender === "user"
                ? "user"
                : "assistant",

            content: String(item.text || "")

        }));

}


// ==========================================
// 21. SEND REQUEST TO NORMAL YEFSA AI
// ==========================================

async function sendToNormalYefsaAI(
    message,
    history
) {

    const token = getBmyToken();

    const headers = {

        "Content-Type": "application/json"

    };

    if (token) {

        headers["Authorization"] =
            "Bearer " + token;

    }

    const response = await fetch(
        API_URL,
        {

            method: "POST",

            headers,

            body: JSON.stringify({

                message,

                history: history.map(item => ({

                    role: item.role === "assistant"
                        ? "model"
                        : "user",

                    text: item.content

                })),

                memories: token
                    ? []
                    : loadMemories()

            })

        }
    );

    return readAIResponse(response);

}


// ==========================================
// 22. SEND REQUEST TO BMY BUSINESS AI
// ==========================================

async function sendToBmyAI(
    message,
    history,
    session
) {

    if (!session || !session.business) {

        throw new Error(
            "You are logged into BMY, but no business is selected. Open BMY, select your business, and return to Yefsa AI."
        );

    }

    const businessId = session.business.id;

    const reviewRequest =
        isBusinessReviewRequest(message);

    const endpoint = reviewRequest

        ? `${BMY_CHAT_URL}/${businessId}/ai/review`

        : `${BMY_CHAT_URL}/${businessId}/ai/chat`;


    console.log(
        "Yefsa AI is connected to BMY business:",
        businessId
    );

    console.log(
        "BMY AI endpoint:",
        endpoint
    );


    const requestOptions = {

        method: "POST",

        headers: {

            "Content-Type": "application/json",

            "Authorization": "Bearer " + session.token

        }

    };


    // The review endpoint generates its own
    // business review and accepts no request body.

    if (!reviewRequest) {

        requestOptions.body = JSON.stringify({

            message,

            history

        });

    }


    const response = await fetch(
        endpoint,
        requestOptions
    );

    return readAIResponse(response);

}


// ==========================================
// 23. READ AI RESPONSE
// ==========================================

async function readAIResponse(response) {

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


    console.log(
        "AI response:",
        data
    );


    if (!response.ok) {

        throw new Error(
            data.error ||
            data.message ||
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

    return data.reply.trim();

}


// ==========================================
// 24. MAIN SEND MESSAGE FUNCTION
// ==========================================

async function sendMessage() {

    if (!chatBox || !userInput || !sendBtn) {

        console.error(
            "Chat interface is unavailable."
        );

        return;

    }

    const message = userInput.value.trim();

    if (!message || sendBtn.disabled) {
        return;
    }


    // HANDLE MEMORY REQUESTS

    const rememberMatch = message.match(
        /^remember that\s+(.+)/i
    );

    if (rememberMatch) {

        const memory = rememberMatch[1].trim();

        addMessage(message, "user");

        userInput.value = "";

        sendBtn.disabled = true;

        try {

            const storageType =
                await rememberInformation(memory);

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


    // GET HISTORY BEFORE ADDING THE NEW MESSAGE

    const history = getConversationHistory();


    // DISPLAY USER MESSAGE

    addMessage(message, "user");

    userInput.value = "";

    sendBtn.disabled = true;


    // THINKING INDICATOR

    const thinking = addMessage(
        "Thinking...",
        "bot",
        false
    );

    thinking.classList.add("thinking");


    try {

        // CHECK BMY LOGIN AND BUSINESS SELECTION

        const bmySession = getBmySession();

        let reply;


        if (bmySession && bmySession.authenticated) {

            // A BMY LOGIN EXISTS.
            // DO NOT SILENTLY FALL BACK TO GENERAL AI.

            if (!bmySession.business) {

                throw new Error(
                    "You're logged into BMY, but no business is selected. Open BMY, select Test Business, and return to Yefsa AI."
                );

            }


            // CONNECT TO THE SELECTED BUSINESS

            reply = await sendToBmyAI(
                message,
                history,
                bmySession
            );

        } else {

            // NORMAL YEFSA AI FOR GUEST USERS

            reply = await sendToNormalYefsaAI(
                message,
                history
            );

        }


        // DISPLAY AI RESPONSE

        renderFormattedMessage(
            thinking,
            reply
        );

        thinking.classList.remove("thinking");

        styleMessage(thinking, "bot");

        saveActiveChat();


    } catch (error) {

        console.error(
            "Yefsa AI error:",
            error
        );

        const errorMessage =
            "Connection error: " + error.message;

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
// 25. OPEN AND CLOSE MENU
// ==========================================

if (menuBtn && dropdownMenu) {

    menuBtn.addEventListener(
        "click",
        function(event) {

            event.stopPropagation();

            dropdownMenu.hidden =
                !dropdownMenu.hidden;

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
// 26. NEW CHAT BUTTON
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
// 27. DELETE CURRENT CHAT
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

            if (!confirmed) {
                return;
            }

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
// 28. DISPLAY CHAT HISTORY
// ==========================================

function renderHistory() {

    if (!historyList) {
        return;
    }

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

        title.textContent =
            chat.title || "New Chat";


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

                if (!newTitle || !newTitle.trim()) {
                    return;
                }

                chat.title = newTitle.trim();

                chat.customTitle = true;

                chat.updatedAt = Date.now();

                saveConversations();

                renderHistory();

            }
        );


        // DELETE CONVERSATION

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

                if (!confirmed) {
                    return;
                }

                conversations = conversations.filter(
                    item => item.id !== chat.id
                );

                if (activeChatId === chat.id) {

                    activeChatId =
                        conversations.length > 0
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
// 29. OPEN CHAT HISTORY
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
// 30. CLOSE CHAT HISTORY
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
// 31. SUBSCRIBE OPTION
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
// 32. CHAT WITH DEVELOPER
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
// 33. SEND BUTTON
// ==========================================

if (sendBtn) {

    sendBtn.addEventListener(
        "click",
        sendMessage
    );

}


// ==========================================
// 34. ENTER KEY
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
// 35. START APPLICATION
// ==========================================

loadConversations();


// ==========================================
// 36. REGISTER SERVICE WORKER
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
// 37. YEFSATECH HOME SCREEN AND NAVIGATION
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


    // GREETING

    function updateWelcomeGreeting() {

        if (!welcomeGreeting) {
            return;
        }

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


    // SHOW SELECTED SCREEN

    function showScreen(screen) {

        if (homeScreen) {

            homeScreen.hidden =
                screen !== "home";

        }

        if (chatScreen) {

            chatScreen.hidden =
                screen !== "chat";

        }

        if (bmyScreen) {

            bmyScreen.hidden =
                screen !== "bmy";

        }


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


    // OPEN BMY

    if (openBmyBtn) {

        openBmyBtn.addEventListener(
            "click",
            function() {

                window.location.href =
                    "https://keithyefsa.github.io/yefsa-ai-frontend/indexbmy.html";

            }
        );

    }


    // RETURN HOME FROM CHAT

    if (backHomeFromChatBtn) {

        backHomeFromChatBtn.addEventListener(
            "click",
            function() {

                showScreen("home");

            }
        );

    }


    // RETURN HOME FROM BMY

    if (backHomeFromBmyBtn) {

        backHomeFromBmyBtn.addEventListener(
            "click",
            function() {

                showScreen("home");

            }
        );

    }


    // INITIALIZE HOME

    updateWelcomeGreeting();

    showScreen("home");

})();
