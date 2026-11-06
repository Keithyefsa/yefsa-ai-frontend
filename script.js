
const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

const API_URL = "https://yefsa-ai-backend.onrender.com/chat";
const STORAGE_KEY = "yefsa_ai_chat_v1";

// Save conversation to the phone's browser storage
function saveChat() {
    const messages = Array.from(
        chatBox.querySelectorAll(".message")
    )
    .filter(message => !message.classList.contains("thinking"))
    .map(message => ({
        text: message.textContent,
        sender: message.classList.contains("user")
            ? "user"
            : "bot"
    }));

    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(messages)
        );
    } catch (error) {
        console.error("Could not save chat:", error);
    }
}

// Restore previous conversation
function loadChat() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (!saved) return;

        const messages = JSON.parse(saved);

        if (!Array.isArray(messages)) return;

        chatBox.innerHTML = "";

        messages.forEach(item => {
            const message = document.createElement("div");
            message.classList.add("message", item.sender);
            message.textContent = item.text;
            chatBox.appendChild(message);
        });

        chatBox.scrollTop = chatBox.scrollHeight;

    } catch (error) {
        console.error("Could not restore chat:", error);
    }
}

function addMessage(text, sender, shouldSave = true) {
    const message = document.createElement("div");
    message.classList.add("message", sender);
    message.textContent = text;

    chatBox.appendChild(message);
    chatBox.scrollTop = chatBox.scrollHeight;

    if (shouldSave) saveChat();

    return message;
}

// Send message to Yefsa AI
async function sendMessage() {
    const message = userInput.value.trim();

    if (!message || sendBtn.disabled) return;

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
                message: message
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Something went wrong.");
        }

        thinking.textContent = data.reply;
        thinking.classList.remove("thinking");

        saveChat();

    } catch (error) {
        thinking.textContent =
            "Sorry, I couldn't connect. Please try again.";

        thinking.classList.remove("thinking");

        saveChat();
        console.error(error);

    } finally {
        sendBtn.disabled = false;
        userInput.focus();
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

sendBtn.addEventListener("click", sendMessage);

userInput.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        sendMessage();
    }
});

// Restore chat when app opens
loadChat();

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
