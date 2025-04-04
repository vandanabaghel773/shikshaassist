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
const { Document, Packer, Paragraph, TextRun,  HeadingLevel  } = require("docx");
const { PdfReader } = require('pdfreader');
const mammoth = require('mammoth');
const vision = require('@google-cloud/vision');
const { ImageAnnotatorClient } = require('@google-cloud/vision');
const { exec } = require('child_process');
// === Configurations ===
dotenv.config();
const app = express();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_NOTES_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
// === Middlewares ===
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
const uploadsDir = path.join(__dirname, 'assignment/uploads/pdf-images');


app.use(express.static('main_website'));
app.use(express.static(path.join(__dirname, "main_website")));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/final_notes', express.static(path.join(__dirname, 'final_notes')));
app.use(express.static(path.join(__dirname, 'final_notes')));
app.use('/css_present', express.static(path.join(__dirname, 'css_present')));
app.use(express.static(path.join(__dirname, 'css_present')));
app.use('/assignment', express.static(path.join(__dirname, 'assignment')));
app.use(express.static(path.join(__dirname, 'assignment')));
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
app.get('/analyze', (req, res) => {
  res.sendFile(path.join(__dirname, 'assignment', 'index.html'));
});
// assignment cheker code 

const uploadsass = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadsass)) {
    fs.mkdirSync(uploadsass);
}

const ass_storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const ass_upload = multer({ storage: ass_storage });
app.use(express.static(path.join(__dirname, 'public')));

const client = new vision.ImageAnnotatorClient({
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

const ass_genAI = new GoogleGenerativeAI(process.env.ASS_GEMINI_API_KEY); // Add this line



const visionClient = new ImageAnnotatorClient({
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});


const extractTextFromPdf = async (filePath) => {
    return new Promise((resolve, reject) => {
        const imageFolderPath = path.join(uploadsass, 'pdf-images');
        if (!fs.existsSync(imageFolderPath)) {
            fs.mkdirSync(imageFolderPath);
        }

        console.log(`PDF file path: ${filePath}`);

        const command = `pdftoppm -jpeg -r 300 "${filePath.replace(/\\/g, '/')}" "${imageFolderPath}/image"`; // Corrected line

        exec(command, async (error, stdout, stderr) => {
            if (error) {
                console.error(`Error converting PDF to images: ${error}`);
                reject('Error converting PDF to images.');
                return;
            }

            let extractedText = '';
            const imageFiles = fs.readdirSync(imageFolderPath);

            for (const imageFile of imageFiles) {
                if (imageFile.endsWith('.jpg')) {
                    const imagePath = path.join(imageFolderPath, imageFile);
                    try {
                        const [result] = await visionClient.textDetection(imagePath);
                        const detections = result.textAnnotations;
                        if (detections && detections.length > 0) {
                            extractedText += detections[0].description + ' ';
                        }
                    } catch (visionError) {
                        console.error(`Error analyzing image with Vision API: ${visionError}`);
                        reject('Error analyzing image with Vision API.');
                        return;
                    }
                }
            }
            // delete images after processing.
            for (const imageFile of imageFiles) {
                if (imageFile.endsWith('.jpg')) {
                    const imagePath = path.join(imageFolderPath, imageFile);
                    fs.unlinkSync(imagePath);
                }
            }

            resolve(extractedText);
        });
    })
};
const extractTextFromDocx = async (filePath) => {
    console.log(`Extracting text from DOCX: ${filePath}`); // Debug log
    try {
        const result = await mammoth.extractRawText({ path: filePath });
        console.log(`Extracted text: ${result.value}`); // Debug log
        return result.value;
    } catch (error) {
        console.error('Error extracting text from DOCX:', error);
        return ''; // Return an empty string in case of an error
    }
};

const analyzeImage = async (imagePath) => {
    // ... (Your existing image analysis code)
};

app.post('/analyze', ass_upload.single('assignmentFile'), async (req, res) => {
    try {
        const filePath = req.file.path;
        console.log("Uploaded file path: ", filePath);
        let extractedText = '';

        if (filePath.endsWith('.jpg') || filePath.endsWith('.png') || filePath.endsWith('.jpeg')) {
            extractedText = await analyzeImage(filePath);
            if(extractedText === 'Error analyzing the image.'){
                return res.json({feedback: "Error: Cloud vision API error", marks: 0});
            }
        } else if (filePath.endsWith('.pdf')) {
            extractedText = await extractTextFromPdf(filePath);
        } else if (filePath.endsWith('.docx')) {
            extractedText = await extractTextFromDocx(filePath);
        } else {
            return res.status(400).json({ error: 'Unsupported file format' });
        }

        if(!extractedText){
            return res.json({feedback: "Error: No text extracted from file. Please check the document", marks: 0});
        }
        const feedback = await generateGeminiFeedback(extractedText);

        fs.unlinkSync(filePath);
        res.json({ feedback });
    } catch (error) {
        console.error('Error during analysis:', error);
        res.status(500).json({ error: 'Error processing the assignment' });
    }
});

async function generateGeminiFeedback(text) {
    if (!text) return 'No content found to analyze.';

    try {
        const model = ass_genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Or "gemini-pro-vision"
        const prompt = `Analyze the student's assignment: "${text}". Provide a score out of 100 and a very brief (1-5 sentences) assessment of correctness. Do not include any explanations beyond the score and assessment.`;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let aiFeedback = response.text();

        // Post-processing: Truncate to a maximum length (e.g., 200 characters)
        if (aiFeedback.length > 400) {
            aiFeedback = aiFeedback.substring(0, 400) + "...";
        }

        // Post-processing: Truncate to a maximum of 2 sentences.
        const sentences = aiFeedback.split(". ");
        if(sentences.length > 5){
            aiFeedback = sentences.slice(0,5).join(". ") + ".";
        }

        return aiFeedback;
    } catch (error) {
        console.error("Error generating Gemini feedback:", error);
        return "Error generating AI feedback.";
    }
}

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
const ppt_storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`)
});
const ppt_upload = multer({storage: ppt_storage });

// === Create 'uploads' Directory if Not Exists ===
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// === Clean Previous Files on Server Start ===
fs.readdirSync('uploads').forEach(file => {
  fs.unlinkSync(path.join('uploads', file));
});

// === Route: Upload and Process Video ===
app.post('/process-video', ppt_upload.single('video'), async (req, res) => {
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



app.post("/download-docx", async (req, res) => {
  try {
      const { notes, topic } = req.body; // ✅ Extract `topic` properly
      if (!notes) return res.status(400).json({ error: "No notes available to download." });

      // Convert HTML formatted notes into properly formatted text
      let formattedText = notes
          .replace(/<b>(.*?)<\/b>/g, "**$1**") // Ensure <b> is converted to markdown-style bold
          .replace(/<br\s*\/?>/g, "\n") // Convert <br> to new lines
          .replace(/<[^>]+>/g, ""); // Remove remaining HTML tags

      // Split text into paragraphs
      let paragraphs = formattedText.split("\n").map(line => {
          let parts = [];
          let matches = [...line.matchAll(/\*\*(.*?)\*\*/g)]; // Find all **bold** parts

          if (matches.length > 0) {
              let lastIndex = 0;
              matches.forEach(match => {
                  if (match.index > lastIndex) {
                      parts.push(new TextRun({ text: line.substring(lastIndex, match.index) }));
                  }
                  parts.push(new TextRun({ text: match[1], bold: true })); // ✅ Apply actual bold formatting
                  lastIndex = match.index + match[0].length;
              });
              if (lastIndex < line.length) {
                  parts.push(new TextRun({ text: line.substring(lastIndex) }));
              }
          } else {
              parts.push(new TextRun({ text: line }));
          }

          return new Paragraph({
              spacing: { after: 100 }, // ✅ Less space after headings, keeping same for normal text
              children: parts,
          });
      });

      let fileName = topic ? topic.replace(/[^a-zA-Z0-9_-]/g, "_") : "Notes"; // ✅ Use `topic` for filename

      // Generate DOCX file with formatted paragraphs
      const doc = new Document({
          sections: [
              {
                  properties: {},
                  children: [
                      new Paragraph({
                          text: topic || "Notes", // ✅ Add topic as document heading
                          heading: HeadingLevel.HEADING_1,
                          spacing: { after: 50 },
                      }),
                      ...paragraphs, // ✅ Preserve formatted content
                  ],
              },
          ],
      });

      const buffer = await Packer.toBuffer(doc);

      // Set headers with dynamic filename
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}.docx"`);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");

      res.send(buffer);
      
  } catch (error) {
      console.error("Error generating DOCX:", error);
      res.status(500).json({ error: "Failed to generate DOCX file." });
  }
});



// === Start Server ===
const PORT = process.env.PORT || 7000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
