function markdownToText(text) {
  // Remove all HTML tags completely
  text = text.replace(/<\/?[^>]+(>|$)/g, "");

  // Remove Markdown bold (**bold**) & italics (*italic*)
  text = text.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1");

  // Convert headings (#, ##, ###) to bold uppercase text with spacing
  text = text.replace(/(#{1,6})\s*(.*)/g, (_, hashes, content) => `\n**${content.toUpperCase()}**\n`);

  // Convert bullet points (- or *) to "•"
  text = text.replace(/(?:^|\n)[-\*]\s+(.*)/g, (_, content) => `\n• ${content}`);

  // Ensure proper new lines after full stops (". ")
  text = text.replace(/([a-z0-9])\.(\s*[A-Z])/g, '$1.\n$2');

  // Convert numbered lists (1., 2., etc.) to proper new lines
  text = text.replace(/(\d+)\.\s+(.*)/g, (_, num, content) => `\n${num}. ${content}`);

  // Trim extra spaces and return clean text
  return text.trim();
}



// === Video Upload Handling ===
const uploadBtn = document.getElementById('uploadBtn');
const videoInput = document.getElementById('videoInput');
const chatContainer = document.getElementById('chatContainer'); // Ensure correct ID!
const outputDiv = document.querySelector('.outputDiv');


// Step 1: Click Upload Button triggers File Input
uploadBtn.addEventListener('click', () => {
  console.log('📤 Upload button clicked!');
  videoInput.click();
});

// Step 2: After File Selected, Trigger Upload
videoInput.addEventListener('change', () => {
  const file = videoInput.files[0];

  if (!file) {
    alert("❗ Please select a video file.");
    return;
  }

  console.log('✅ Video file selected:', file);

  const videoURL = URL.createObjectURL(file);

  // Display the video on the page
  outputDiv.innerHTML =`
  <div style="text-align:center;">
    <p style="font-weight:bold; color:#00c4a7;">✅ Video uploaded successfully!</p>
    <div class="processing-animation">
      <div class="spinner"></div>
      <p style="color:white; margin-top: 10px;"> This can take Time .. Processing video... Please wait.</p>
    </div>
    <video id="uploadedVideo" src="${videoURL}" controls width="300" style="margin-top:20px; display: none;"></video>
  </div>
`;

// Show the video after processing is done
setTimeout(() => {
  document.querySelector(".processing-animation").style.display = "none";
  document.getElementById("uploadedVideo").style.display = "block";
}, 10000); // Simulating processing time (5 seconds) ;
  

  // Upload the video file to backend
  uploadVideo(file);
});

// Upload video to backend Node.js server
async function uploadVideo(file) {
  console.log('🚀 Uploading video to server:', file);

  const formData = new FormData();
  formData.append('video', file);

  // Optional UX message in chat container
  const thinkingMessage = document.createElement("div");
  thinkingMessage.classList.add("message", "gemini-message");
  thinkingMessage.innerHTML = `<div class="loading-container">
  <span class="dot"></span>
  <span class="dot"></span>
  <span class="dot"></span>
</div>
`;
  chatContainer.appendChild(thinkingMessage);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  try {
    // ✅ POST request to /upload-video on Node.js server (port 5000)
    const res = await fetch('/process-video', {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    console.log('✅ Response from server:', data);

    if (res.ok) {
      // Replace "Thinking" message with Gemini feedback
      thinkingMessage.innerText = markdownToText(data.message);

      // Optional: Apply styles to highlight Gemini feedback (can customize in CSS)
      //thinkingMessage.style.fontWeight = 'bold';
      thinkingMessage.style.color = 'white';

    } else {
      thinkingMessage.innerText = `❌ Error: ${data.error || 'Unknown error'}`;
    }

  } catch (error) {
    console.error('❌ Upload error:', error);
    thinkingMessage.innerText = "❌ An error occurred during upload.";
  }

  chatContainer.scrollTop = chatContainer.scrollHeight;
}
// Custom Scrollbar Styling Using JavaScript
const style = document.createElement('style');
style.innerHTML = `
  ::-webkit-scrollbar {
    width: 10px;
  }
  ::-webkit-scrollbar-track {
    background: #222;
    border-radius: 5px;
  }
  ::-webkit-scrollbar-thumb {
    background: #00bcd4;
    border-radius: 5px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #00c4a7;
  }
`;
document.head.appendChild(style);

// Show Gemini's response in chat container (generic for text prompts)
function displayGeminiResponse(message) {
  if (!chatContainer) {
    console.error("❗ chatContainer element not found!");
    return;
  }

  const geminiMessage = document.createElement("div");
  geminiMessage.classList.add("message", "gemini-message");
  geminiMessage.innerText = message;

  chatContainer.appendChild(geminiMessage);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

document.getElementById("promptInput").addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    event.preventDefault(); // Prevent form submission
    askGemini(event);
  }
});

async function askGemini(event) {
  event.preventDefault(); // Prevent unexpected form submission
  
  const promptInput = document.getElementById("promptInput");
  const chatContainer = document.getElementById('chatContainer');
  const prompt = promptInput.value.trim();

  if (!prompt) {
    alert("❗ Please enter a prompt!");
    return;
  }

  // Append user message
  const userMessage = document.createElement("div");
  userMessage.classList.add("message", "user-message");
  userMessage.innerText = prompt;
  chatContainer.appendChild(userMessage);

  // Clear prompt input after sending
  promptInput.value = "";

  // Auto-scroll to bottom
  chatContainer.scrollTop = chatContainer.scrollHeight;

  try {
    // Append Gemini thinking...
    const geminiMessage = document.createElement("div");
    geminiMessage.classList.add("message", "gemini-message");
    geminiMessage.innerHTML =  `<div class="loading-container">
    <span class="dot"></span>
    <span class="dot"></span>
    <span class="dot"></span>
  </div>
`;;
    chatContainer.appendChild(geminiMessage);

    const res = await fetch('/ask-gemini', {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt })
    });

    const data = await res.json();

    if (res.ok) {
      geminiMessage.innerHTML = markdownToText(data.message);
    } else {
      geminiMessage.innerText = `❌ Error: ${data.error || 'Unknown error'}`;
    }

  } catch (err) {
    console.error("❌ Fetch error:", err);
    const errorMessage = document.createElement("div");
    errorMessage.classList.add("message", "gemini-message");
    errorMessage.innerText = "❌ An error occurred. Check console.";
    chatContainer.appendChild(errorMessage);
  }

  chatContainer.scrollTop = chatContainer.scrollHeight;
}
