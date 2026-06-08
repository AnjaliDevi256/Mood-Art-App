const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Allow large image strings

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("DB Connected to Atlas! "))
    .catch(err => console.log("DB Connection Error: ", err));

const MoodSchema = new mongoose.Schema({
    prompt: String,
    imageUrl: String,
    createdAt: { type: Date, default: Date.now }
});
const Mood = mongoose.model('Mood', MoodSchema);
app.post('/generate', async (req, res) => {
    try {
        const { prompt } = req.body;
         if (!prompt || prompt.trim() === "") {
            return res.status(400).json({
                error: "Please enter a prompt"
            });
        }
        console.log("Generating art for:", prompt);

       const response = await axios({
            url: "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell",
            method: "POST",
            headers: { 
                "Authorization": `Bearer ${process.env.HF_TOKEN}`,
                "Content-Type": "application/json",
               
                "Accept": "image/png" 
            },
            data: { 
                inputs: prompt,
                provider: "hf-inference" 
            },
            responseType: 'arraybuffer',
        });

        const base64Image = Buffer.from(response.data, 'binary').toString('base64');
        const dataUrl = `data:image/jpeg;base64,${base64Image}`;

        const newEntry = await Mood.create({ prompt, imageUrl: dataUrl });
        console.log("Success! Image saved to MongoDB.");
        res.json(newEntry);

    } catch (e) { 
        if (e.response) {
            const errorData = Buffer.from(e.response.data).toString();
            console.log("Hugging Face Says:", errorData);
            if (e.response.status === 503 || errorData.includes("loading")) {
                return res.status(503).json({ error: "AI waking up... click again in 20s" });
            }
        }
        console.log("Error:", e.message);
        res.status(500).send("Server Error"); 
    }
});
// Get Gallery Route
app.get('/gallery', async (req, res) => {
    const items = await Mood.find().sort({ createdAt: -1 });
    res.json(items);
});

app.delete('/delete/:id', async (req, res) => {
    try {
        await Mood.findByIdAndDelete(req.params.id);
        res.json({ message: "Image removed!" });
    } catch (e) {
        res.status(500).send("Error encountered in deleting");
    }
});
app.listen(5000, () => console.log("Server on 5000"));