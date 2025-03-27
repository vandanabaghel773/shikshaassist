

// === Sidebar Toggle ===
const sidebar = document.querySelector('.sidebar');
const toggleSidebarBtn = document.getElementById('toggleSidebar');

toggleSidebarBtn.addEventListener('click', () => {
  sidebar.classList.toggle('collapsed');
  toggleSidebarBtn.innerHTML = sidebar.classList.contains('collapsed')
    ? 'arrow_forward'
    : 'arrow_back';
});

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
  outputDiv.innerHTML = `
    <div style="text-align:center;">
      <p style="font-weight:bold; color:#00c4a7;">✅ Video uploaded successfully!</p>
      <p style="color:white;">This process can take 1 or 2 mins....please wait </p>
      <video id="uploadedVideo" src="${videoURL}" controls width="300" style="margin-top:20px;"></video>
    </div>
  `;

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
  thinkingMessage.innerText ="Thinking......";
  chatContainer.appendChild(thinkingMessage);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  try {
    // ✅ POST request to /upload-video on Node.js server (port 5000)
    const res = await fetch('http://localhost:5000/process-video', {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    console.log('✅ Response from server:', data);

    if (res.ok) {
      // Replace "Thinking" message with Gemini feedback
      thinkingMessage.innerText = data.message;

      // Optional: Apply styles to highlight Gemini feedback (can customize in CSS)
      //thinkingMessage.style.fontWeight = 'bold';
      thinkingMessage.style.color = 'black';

    } else {
      thinkingMessage.innerText = `❌ Error: ${data.error || 'Unknown error'}`;
    }

  } catch (error) {
    console.error('❌ Upload error:', error);
    thinkingMessage.innerText = "❌ An error occurred during upload.";
  }

  chatContainer.scrollTop = chatContainer.scrollHeight;
}

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

// Ask Gemini API with custom prompt (text input)
async function askGemini() {
  event.preventDefault();
  const promptInput = document.getElementById("promptInput");
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
    

    geminiMessage.innerText = "Thinking";
    chatContainer.appendChild(geminiMessage);

    const res = await fetch('http://localhost:5000/ask-gemini', {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt })
    });

    const data = await res.json();

    if (res.ok) {
      geminiMessage.innerText = data.message;
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
