// === Imports ===
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const multer = require('multer');
const fetch = require('node-fetch');
const fs = require('fs');
const FormData = require('form-data');
const PptxGenJS = require("pptxgenjs");

// === Configurations ===
dotenv.config();
const app = express();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_NOTES_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
// === Middlewares ===
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());


app.use(express.static('main_website'));
app.use(express.static(path.join(__dirname, "main_website")));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/final_notes', express.static(path.join(__dirname, 'final_notes')));
app.use(express.static(path.join(__dirname, 'final_notes')));
app.use('/css_present', express.static(path.join(__dirname, 'css_present')));
app.use(express.static(path.join(__dirname, 'css_present')));
// === Serve Frontend ===
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "main_website", "index.html"));
});
app.get("notes",(req,res) =>{
  res.sendFile(path.join(__dirname,"final_notes","index.html"))
})
app.get('/analyzer', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/ppt', (req, res) => {
  res.sendFile(path.join(__dirname, 'css_present', 'index.html'));
});
const pptAI = new GoogleGenerativeAI(process.env.PPT_API_KEY); // Replace with your actual API Key



// Route to generate slides
app.post("/generate-slides", async (req, res) => {
    try {
        const { topic, slideCount } = req.body;
        if (!topic || !slideCount || slideCount < 1) {
            return res.status(400).json({ error: "Valid topic and slide count required" });
        }

        // Get AI-generated content
        const model = pptAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });
        const result = await model.generateContent(`
            Create exactly ${slideCount} slides for a PowerPoint presentation on "${topic}". 
            Each slide must have:
            - A clear **Title**
            - 3-5 **Bullet Points**
            - Keep it short and formatted like:
            
            Slide X:
            **Title:** Slide Title Here
            - Bullet point 1
            - Bullet point 2
            - Bullet point 3
        `);
        const response = await result.response.text();

        // Convert response into structured slides
        const slidesData = parseSlides(response);
        if (slidesData.length === 0) {
            return res.status(500).json({ error: "AI response could not be parsed." });
        }

        // Create a new PowerPoint
        const pptx = new PptxGenJS();
        slidesData.forEach(slide => {
            let pptSlide = pptx.addSlide();
            pptSlide.addText(slide.title, { x: 0.5, y: 0.5, fontSize: 28, bold: true });

            slide.content.forEach((point, index) => {
                pptSlide.addText(`• ${point}`, { x: 0.5, y: 1 + index * 0.5, fontSize: 20 });
            });
        });

        // Save the PPTX file
        const filePath = path.join(__dirname, "public", "presentation.pptx");
        await pptx.writeFile({ fileName: filePath });

        res.json({ downloadLink: "/presentation.pptx" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error generating slides" });
    }
});

// Function to parse AI-generated text into structured slides
function parseSlides(aiResponse) {
    const slides = [];
    const sections = aiResponse.split("\n\n").filter(sec => sec.includes("Slide"));

    sections.forEach(section => {
        const lines = section.split("\n").map(line => line.trim()).filter(line => line);
        let title = "";
        const content = [];

        lines.forEach(line => {
            if (line.startsWith("**Title:**")) {
                title = line.replace("**Title:**", "").trim();
            } else if (line.startsWith("-")) {
                content.push(line.replace("-", "").trim());
            }
        });

        if (title && content.length > 0) {
            slides.push({ title, content });
        }
    });

    return slides;
}
// === Multer (File Upload) Configuration ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`)
});
const upload = multer({ storage });

// === Create 'uploads' Directory if Not Exists ===
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// === Clean Previous Files on Server Start ===
fs.readdirSync('uploads').forEach(file => {
  fs.unlinkSync(path.join('uploads', file));
});

// === Route: Upload and Process Video ===
app.post('/process-video', upload.single('video'), async (req, res) => {
  const videoPath = req.file.path;
  console.log("✅ Video file received:", videoPath);

  try {
    // Step 1: Send video to FastAPI (Python server)
    const analysisResult = await sendVideoToPython(videoPath);

    if (analysisResult.status === 'error') {
      console.error('❌ Error from FastAPI:', analysisResult.message);
      return res.status(500).json({ error: 'Python service error' });
    }

    console.log('✅ Analysis data from FastAPI:', analysisResult.data);

    // Step 2: Send the analysis result to Gemini AI for feedback
    const geminiFeedback = await sendToGemini(analysisResult.data);
    //console.log('✅ Gemini AI feedback:', geminiFeedback);

    // Step 3: Send feedback back to the frontend
    res.json({ message: geminiFeedback });

  } catch (error) {
    console.error('❌ Error during video processing:', error.message);
    res.status(500).json({ error: 'Server error during video upload.' });
  } finally {
    // Clean up uploaded file
    fs.unlink(videoPath, (err) => {
      if (err) console.error('❌ Error deleting file:', err);
      else console.log('✅ Deleted temporary file:', videoPath);
    });
  }
});

// === Function: Send Video to FastAPI ===
async function sendVideoToPython(filePath) {
  const pythonURL = 'http://127.0.0.1:8000/process-video/';

  const fileStream = fs.createReadStream(filePath);
  const formData = new FormData();
  formData.append('file', fileStream);

  try {
    const response = await fetch(pythonURL, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorText = `${response.status} ${response.statusText}`;
      console.error(`❌ Python server error: ${errorText}`);
      return { status: 'error', message: errorText };
    }

    const data = await response.json();
    return { status: 'success', data };

  } catch (error) {
    console.error('❌ Error sending video to Python:', error.message);
    return { status: 'error', message: error.message };
  }
}

// === Function: Send Analysis Data to Gemini AI ===
async function sendToGemini(analysisData) {
  const prompt = `
You are an AI communication coach. Based on the following pose analysis data, provide key points  on body language and posture , gestures and communication skills . Suggest improvements where necessary  give helpful tips for improvement  only give helpful tips and tips for improvements dont add extra things , dont give ** in the response you can bold the headings or italic it.

Pose Data:
${JSON.stringify(analysisData, null, 2)}
`;

  const geminiURL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

  try {
    const response = await fetch(geminiURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();

    if (!response.ok || !data.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error('❌ Invalid Gemini response:', data);
      return 'No feedback available. Please try again.';
    }

    const feedback = data.candidates[0].content.parts[0].text;
    return feedback;

  } catch (error) {
    console.error('❌ Error getting feedback from Gemini:', error.message);
    return 'Error retrieving feedback from Gemini.';
  }
}

// === Route: Ask Gemini Directly from Chat ===
app.post("/ask-gemini", async (req, res) => {
  const userPrompt = req.body.prompt;

  if (!userPrompt) {
    return res.status(400).json({ error: "Prompt is required." });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(userPrompt);
    const geminiResponse = result.response.text();

    res.json({ message: geminiResponse });

  } catch (error) {
    console.error("❌ Gemini API Error:", error.message);
    res.status(500).json({ error: "Gemini API failed." });
  }
});
app.post('/generate-notes', async (req, res) => {
    const { subject, gradeLevel, topic, language } = req.body;

    if (!subject || !gradeLevel || !topic || !language) {
        return res.status(400).json({ error: 'Subject, grade level, topic, and language are required.' });
    }

    const prompt = `Generate detailed notes on "${topic}" for ${gradeLevel} ${subject} students in ${language} language.`;

    try {
        const result = await model.generateContent({
            contents: [{ parts: [{ text: prompt }] }]
        });

        if (
            !result || !result.response || !result.response.candidates ||
            result.response.candidates.length === 0 ||
            !result.response.candidates[0].content ||
            !result.response.candidates[0].content.parts ||
            result.response.candidates[0].content.parts.length === 0
        ) {
            throw new Error("Invalid response from Gemini API");
        }

        let generatedNotes = result.response.candidates[0].content.parts[0].text.trim();
        let formattedNotes = generatedNotes.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');

        res.json({ notes: formattedNotes });

    } catch (error) {
        console.error('Error generating notes:', error);
        res.status(500).json({ error: 'Failed to generate notes.' });
    }
});

app.post("/download-txt", async (req, res) => {
    try {
        const { notes } = req.body;
        if (!notes) return res.status(400).json({ error: "No notes available to download." });

        // Convert HTML formatted notes to plain text with markdown-style bold
        let plainText = notes
            .replace(/<b>(.*?)<\/b>/g, "**$1**") // Convert bold text to **bold**
            .replace(/<br\s*\/?>/g, "\n") // Replace <br> with new lines
            .replace(/<[^>]+>/g, ""); // Remove any remaining HTML tags

        // Save to a temporary file
        const filePath = path.join(__dirname, 'public', 'Notes.txt');
        fs.writeFileSync(filePath, plainText, 'utf8');

        res.download(filePath, 'Notes.txt', (err) => {
            if (err) {
                console.error("Error downloading TXT file:", err);
                res.status(500).json({ error: "Failed to generate TXT file." });
            }
            fs.unlinkSync(filePath); // Remove file after download
        });
    } catch (error) {
        console.error("Error generating TXT:", error);
        res.status(500).json({ error: "Failed to generate TXT." });
    }
});

// === Start Server ===
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
