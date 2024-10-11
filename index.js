const express = require("express")
const server = express()
const cors = require("cors")
const mongodb = require("mongodb")
const dotenv = require("dotenv")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const asynchandler = require("express-async-handler")
dotenv.config()
const client =new mongodb.MongoClient(process.env.DB_URL)
const path = require("path")
const bodyParser = require("body-parser")
const axios = require('axios')

// use middleware
server.use(express.json())

server.use(express.static(path.join(__dirname,"public/")))
server.use(cors())
server.use(bodyParser.urlencoded({extended:true}))
server.set("view engine","ejs")
server.use(express.static('public'));


//read the connection inside of the dotenv
const port = process.env.PORT || 3000
const db_name = process.env.DB_NAME
const db_table = process.env.DB_TABLE


server.get("/register", (req,res)=>{
    res.render("register")
})

server.post("/register" ,async(req,res)=>{
    const username = req.body.username.trim()
    const email = req.body.email.trim()
    const password = req.body.password.trim()
    const confirm = req.body.confirm.trim()
    if (password.length == 0 || confirm.length == 0){
        res.status(400).send("input field cannot be empty")
    }
    if(password != confirm){
        res.status(400).send("password do not match")
    }
    const hashedPassword = await bcrypt.hash(password,10)
    const profile = {username:username,password:hashedPassword, email:email}
    const admin = await client.db(process.env.DB_NAME).collection
    (db_table).findOne({email:email})
    if(admin){
        res.status(400).send("Email already exists, go and login")
    }else{
    const feed =await client.db(process.env.DB_NAME).collection(db_table).
    insertOne(profile)
    if(feed){
        res.redirect('/holyland/admin')
    }}
})

server.get("/login", (req,res)=>{
    res.render("login")
})

server.post("/login", async(req,res)=>{
    const email= req.body.email
    const password = req.body.password
    Admindetails = {email:email,password: password}
    // console.log(Admindetails)
    await client.db(process.env.DB_NAME).collection(db_table).findOne({email:email}).then(admin=>{
        if(admin){
            bcrypt.compare(password,admin.password).then(match =>{
                if(match){
                    res.redirect('/holyland/admin')   
                }else{
                    res.status(400).send("incorrect password")
                }
            })
        }else{
            res.status(400).send("user does not exist")
        }
    })

})
      
server.get("/holyland/home",(req,res)=>{
    res.render("index.ejs")
})

server.get("/holyland/events",(req,res)=>{
    res.render("events.ejs")
})

server.get("/holyland/gallery",(req,res)=>{
    res.render("gallery.ejs")
})

server.get("/holyland/admin",(req,res)=>{
    res.render("admin.ejs")
})

server.get("/holyland/e-library",(req,res)=>{
    res.render("e-library.ejs")
})

server.get("/e-libraryhome",(req,res)=>{
    res.render("e-libraryhome.ejs")
})

server.get("/userregister",(req,res)=>{
    res.render("userregister.ejs")
})

server.post("/userregister" ,async(req,res)=>{
    const username = req.body.username.trim()
    const email = req.body.email.trim()
    const password = req.body.password.trim()
    const confirm = req.body.confirm.trim()
    if (password.length == 0 || confirm.length == 0){
        res.status(400).send("input field cannot be empty")
    }
    if(password != confirm){
        res.status(400).send("password do not match")
    }
    const hashedPassword = await bcrypt.hash(password,10)
    const profile = {username:username,password:hashedPassword, email:email}
    const user = await client.db(process.env.DB_NAME).collection
    (db_table).findOne({email:email})
    if(user){
        res.status(400).send("Email already exists, go and login")
    }else{
    const feed =await client.db(process.env.DB_NAME).collection(db_table).
    insertOne(profile)
    if(feed){
        res.redirect('/e-libraryhome')
    }}
})


server.get("/userlogin",(req,res)=>{
    res.render("userlogin.ejs")
})

server.post("/userlogin", (req,res)=>{
    const email= req.body.email
    const password = req.body.password
    userdetails = {email:email,password: password}
    client.db(process.env.DB_NAME).collection(db_table).findOne({email:email}).then(user=>{
        if(user){
            bcrypt.compare(password,user.password).then(match =>{
                if(match){
                      res.redirect('/e-libraryhome')   
                }else{
                    res.status(400).send("incorrect password")
                }
            })
        }else{
            res.status(400).send("user does not exist")
        }
    })

})


// (async function() {
//   // Search Route
//   server.get('/search', async (req, res) => {
//     const query = req.query.q; // Get the search query from the URL
  
//     if (!query) {
//       // If no query is provided, render the search page with an empty result
//       return res.render('search', { books: [], query: '' });
//     }
  
//     try {
//       // Fetch data from the Open Library Search API
//       const response = await fetch('https://openlibrary.org/search.json?subject=fiction');
//       const data = await response.json();
  
//       // Render the EJS template and pass the book data
//       res.render('search', { books: data.docs || [], query });
//     } catch (error) {
//       console.error('Error fetching search results:', error);
//       res.status(500).send('Error fetching search results');
//     }
//   });

//   // Already Read Route
//   server.get('/already-read', async (req, res) => {
//     try {
//       const response = await fetch('https://openlibrary.org/people/mekBot/books/already-read.json');
//       const data = await response.json();
  
//       // Render the EJS template and pass the book data
//       res.render('already-read', { books: data.reading_log_entries });
//     } catch (error) {
//       console.error('Error fetching books:', error);
//       res.status(500).send('Error fetching books');
//     }
//   });

//   // Want to Read Route
//   server.get('/want-to-read', async (req, res) => {
//     try {
//       const response = await fetch('https://openlibrary.org/people/mekBot/books/want-to-read.json');
//       const data = await response.json();
  
//       // Render the EJS template and pass the book data
//       res.render('want-to-read', { books: data.reading_log_entries });
//     } catch (error) {
//       console.error('Error fetching books:', error);
//       res.status(500).send('Error fetching books');
//     }
//   });

// })();



//api comsuption for E-libraries
// server.get('/books',asynchandler(async(req,res)=>{
//     fetch ("https://openlibrary.org/people/mekBot/books/want-to-read.json/?")
//     .then((response)=>response.json())
//     .then((result)=> res.send(result)
//     )
//     .catch((error)=>console.error(error))
// }))

//currently reading books api
// server.get('/currently-reading',asynchandler(async(req,res)=>{
//     fetch ("https://openlibrary.org/people/mekBot/books/currently-reading.json")
//     .then((response)=>response.json())
//     .then((result)=> res.send(result)
//     )
//     .catch((error)=>console.error(error))
// }))
function getbooks(){

}

//Route to fetch currently reading data from Open Library API
server.get('/currently-reading', async (req, res) => {
   try {
    const response = await fetch('https://openlibrary.org/people/mekBot/books/currently-reading.json');
    const data = await response.json();
  
        // If no query is provided, render the search page with an empty result
        // return res.render('search', { books: [], query: '' });
        res.render('currently-reading', { books: data.reading_log_entries })
    // console.log(rdat)
    // Render the EJS template and pass the book dat
    } catch (error) {
     console.error('Error fetching books:', error);
     res.status(500).send('Error fetching books');
    }
  });
  
// Route to handle book search
server.get('/search', async (req, res) => {
    const query = req.query.q; // Get the search query from the URL
  
    // if (!query) {
    //   // If no query is provided, render the search page with an empty result
    //    res.render('search', { books: [], query: '' });
    // }
  
    try {
      // Fetch data from the Open Library Search API
      const response = await fetch('https://openlibrary.org/search.json?subject=fiction');
      const data = await response.json();
  
      // Render the EJS template and pass the book data
      res.redirect('/currently-reading');
    
    } catch (error) {
      console.error('Error fetching search results:', error);
      res.status(500).send('Error fetching search results');
    }
  });


server.get('/already-read', async (req, res) => {
    try {
      const response = await fetch('https://openlibrary.org/people/mekBot/books/already-read.json');
      const data = await response.json();
  
      // Render the EJS template and pass the book data
      res.render('already-read', { books: data.reading_log_entries });
    } catch (error) {
      console.error('Error fetching books:', error);
      res.status(500).send('Error fetching books');
    }
  });

  server.get('/want-to-read', async (req, res) => {
    try {
      const response = await fetch('https://openlibrary.org/people/mekBot/books/want-to-read.json');
      const data = await response.json();
  
      // Render the EJS template and pass the book data
      res.render('want-to-read', { books: data.reading_log_entries });
    } catch (error) {
      console.error('Error fetching books:', error);
      res.status(500).send('Error fetching books');
    }
  });
  



  

//connect to the express server 
server.listen(port,()=>{
    console.log(`server is listening on port ${port}`)

})