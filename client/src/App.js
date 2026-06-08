import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [prompt, setPrompt] = useState('');
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchGallery(); }, []);

  const fetchGallery = async () => {
    const res = await axios.get('http://localhost:5000/gallery');
    setGallery(res.data);
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/generate', { prompt });
      setPrompt('');
      fetchGallery();
    } catch (err) { 
       if (err.response?.data?.error) {
    alert(err.response.data.error);
  } else {
    alert("Error encountered in generation of AI image");
  }
 }
    setLoading(false);
  };

const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this art?")) {
        await axios.delete(`http://localhost:5000/delete/${id}`);
        fetchGallery(); // Refresh the gallery
    }
};

const handleDownload = (imageUrl, prompt) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `${prompt.substring(0, 10)}.png`; // Name the file after the prompt
    link.click();
};
  return (
    <div className="app-container">
      <h1>MoodArt AI </h1>
      <div className="input-section">
        <input 
          value={prompt} 
          onChange={(e) => setPrompt(e.target.value)} 
          placeholder="How is your mood? (e.g. Electric storm)" 
        />
        <button onClick={handleGenerate}  >{loading ? 'Generating...' : 'Generate Art'}</button>
      </div>
      <div className="gallery">
    {gallery.map(item => (
        <div key={item._id} className="card">
            <img src={item.imageUrl} alt="AI mood" />
            <p>{item.prompt}</p>
            <div className="card-actions">
                <button className="download-btn" onClick={() => handleDownload(item.imageUrl, item.prompt)}>
                    Download
                </button>
                <button className="delete-btn" onClick={() => handleDelete(item._id)}>
                    Remove
                </button>
            </div>
        </div>
    ))}
</div>
    </div>
  );
}

export default App;