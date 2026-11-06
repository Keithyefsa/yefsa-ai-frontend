
const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

const API_URL = "https://yefsa-ai-backend.onrender.com/chat";

function addMessage(text, sender) {
    const message = document.createElement("div");
    message.classList.add("message", sender);
    message.textContent = text;
    chatBox.appendChild(message);
    chatBox.scrollTop = chatBox.scrollHeight;
    return message;
}

async function sendMessage() {
    const message = userInput.value.trim();

    if (!message || sendBtn.disabled) return;

    addMessage(message, "user");
    userInput.value = "";
    sendBtn.disabled = true;

    // Display thinking inside the chat box
    const thinking = addMessage("Thinking...", "bot");
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

        // Replace Thinking with the actual answer
        thinking.textContent = data.reply;
        thinking.classList.remove("thinking");

    } catch (error) {
        thinking.textContent =
            "Sorry, I couldn't connect. Please try again.";

        thinking.classList.remove("thinking");
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

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./service-worker.js")
            .then(() => console.log("YefsaTech is ready!"))
            .catch(error => console.error("Service worker error:", error));
    });
}
