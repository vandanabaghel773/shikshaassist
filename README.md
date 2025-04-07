# SikshaAssist 📚✨

SikshaAssist is an AI-powered web application designed to enhance educational workflows for teachers and students. It offers a suite of smart tools that automate and streamline tasks like note generation, presentation creation, student communication analysis, and assignment evaluation.

## 🔗 Live Demo
https://sikshaassist.xyz/ 

---

## 🌟 Features

### 1. Notes Generator 📝  
Generate structured, downloadable notes based on topic and class using AI. Perfect for both students and teachers.

### 2. PPT Generator 📊  
Automatically create visually appealing PowerPoint presentations. Just enter a topic, and you're good to go.

### 3. Student Video Analysis 🎥  
Upload student videos and receive instant feedback on communication skills, body language, and hand gestures.

### 4. Assignment Checker ✅  
Teachers can upload student assignments. The AI evaluates them and assigns grades with feedback using a Vision API.

---

## 🧑‍💻 Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **UI Framework**: Tailwind CSS (main site), Custom CSS (feature pages)
- **APIs**:
  - Google Gemini API (Notes & PPT Generation)
  - Vision API (Assignment Evaluation)
  - python with MediaPipe (Student Video Analysis)

---

## 📁 Project Structure
sikshaassist/
│
├── assignment/                    # Handles the assignment evaluation feature.
│   └── (Include relevant files/scripts for this module)
│
├── css_present/                   # Stylesheets specific to the presentation generator.
│
├── final_notes/                   # Notes generation module (HTML, JS, API handling).
│
├── main_webs‍ite/                 # Main landing page, routes, and static components.
│
├── node_modules/                  # Node.js dependencies (auto-generated).
│
├── public/                        # Static assets served publicly.
│   ├── index.html                 # Main HTML entry point.
│   ├── script.js                  # Client-side JS for UI interactions.
│   ├── style.css                  # Styling for the main frontend.
│   ├── footer.png                 # Image asset used in footer.
│   ├── presentation.pptx          # Sample or generated presentation file.
│   ├── Untitled.png               # Possibly a placeholder or temporary image.
│
├── python_service/               # Backend Python microservice (e.g., video analysis).
│   ├── main.py                    # Main Python script for processing.
│   ├── temp_videos/               # Temporary storage for uploaded videos.
│   ├── requirements.txt           # Python dependencies.
│   └── ecosystem.config.js        # PM2 configuration for Python service deployment.
│
├── uploads/                       # Uploaded files like student submissions or videos.
│
├── .env                           # Environment variables (API keys, config secrets).
├── .gitignore                     # Git ignore rules.
├── cloud-vision.json              # Google Cloud Vision API credentials.
├── package.json                   # Node.js project configuration.
├── package-lock.json              # Lock file for npm installs.
├── server.js                      # Main Node.js backend server (Express likely).
├── start.ps1                      # PowerShell script to start services.

Future Improvements
-Add login and user profile system

-Enhance AI evaluation with more advanced metrics

-Add support for multilingual content generation

-Export presentations in multiple formats

-Improve mobile responsiveness and accessibility


Built with ❤️ for a Google Developer Group Solution Challenge Hackathon.
