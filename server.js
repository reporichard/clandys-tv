const express = require('express');
const multer = require('multer');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.static(__dirname));
app.use(express.json());

let activeShows = {};
let tvPlayers = {}; // STATUS VIDEO SHOW

// storage upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'videos/'),
  filename: (req, file, cb) => cb(null, file.originalname)
});

const upload = multer({ storage });

// upload video
app.post('/upload', upload.single('video'), (req,res)=>{
  if(!req.file) return res.status(400).send({message:'No file'});

  const playlistPath = 'playlist.json';
  let playlist = [];

  if(fs.existsSync(playlistPath)){
    try{
      playlist = JSON.parse(fs.readFileSync(playlistPath,'utf8'));
    }catch{}
  }

  playlist.push(req.file.filename);

  fs.writeFileSync(playlistPath, JSON.stringify(playlist,null,2));

  res.send({message:'Upload berhasil'});
});

// ambil playlist
app.get('/playlist',(req,res)=>{
  const playlistPath = 'playlist.json';
  let playlist=[];

  if(fs.existsSync(playlistPath)){
    try{
      playlist = JSON.parse(fs.readFileSync(playlistPath,'utf8'));
    }catch{}
  }

  res.json(playlist);
});

// hapus video
app.delete('/delete/:filename',(req,res)=>{
  const filename = req.params.filename;
  const filePath = path.join(__dirname,'videos',filename);

  if(fs.existsSync(filePath)){
    fs.unlinkSync(filePath);
  }

  const playlistPath = 'playlist.json';
  let playlist=[];

  if(fs.existsSync(playlistPath)){
    try{
      playlist = JSON.parse(fs.readFileSync(playlistPath,'utf8'));
    }catch{}
  }

  playlist = playlist.filter(v=>v!==filename);

  fs.writeFileSync(playlistPath, JSON.stringify(playlist,null,2));

  res.send({message:'Video dihapus'});
});

// ping tv online
app.post('/ping',(req,res)=>{
  const {clientId} = req.body;
  if(clientId){
    activeShows[clientId] = Date.now();
  }
  res.json({ok:true});
});

// cek tv online
app.get('/tv-status',(req,res)=>{
  const now = Date.now();

  for(const id in activeShows){
    if(now - activeShows[id] > 10000){
      delete activeShows[id];
    }
  }

  res.json({count:Object.keys(activeShows).length});
});

// show kirim status video per TV
app.post('/now-playing',(req,res)=>{

  const {clientId, video, time} = req.body;

  if(!clientId) return res.json({ok:false});

  tvPlayers[clientId] = {
    video,
    time,
    lastUpdate: Date.now()
  };

  res.json({ok:true});

});


// dashboard ambil semua TV player
app.get('/tv-players',(req,res)=>{

  const now = Date.now();

  for(const id in tvPlayers){
    if(now - tvPlayers[id].lastUpdate > 10000){
      delete tvPlayers[id];
    }
  }

  res.json(tvPlayers);

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
