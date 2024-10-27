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



//read the connection inside of the dotenv
const port = process.env.PORT || 3000
const db_name = process.env.DB_NAME
const db_table = process.env.DB_TABLE

//google books key
const apiKey = process.env.API_KEY
const googleBooksAPI = 'https://www.googleapis.com/books/v1/volumes';

// Email validation regex
const emailRegex = /^[^@]+@[^@]+\.[a-zA-Z]{2,}$/;

// Password validation regex (minimum 8 characters, at least one uppercase, one lowercase, one digit, and one special character)
const passwordRegex = /^(?=.[a-z])(?=.[A-Z])(?=.\d)(?=.[\W_]).{8,}$/;



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
    res.render("admin/dashboard.ejs")
})

server.get("/holyland/e-library",(req,res)=>{
    res.render("e-library.ejs")
})


server.get("/userregister",(req,res)=>{
    res.render("userregister", {error:null})
})

// Handle registration
server.post("/userregister", async (req, res) => {  
    const username = req.body.username.trim();
    const email = req.body.email.trim();
    const password = req.body.password.trim();
    const confirm = req.body.confirm.trim();

    let errorMessage = null; // Initialize an error message variable

    // Validate input fields
    if (!email || !password || !confirm) {
        errorMessage = "All input fields must be filled.";
    } else if (!emailRegex.test(email)) {
        errorMessage = "Please enter a valid email address.";
    } else if (!passwordRegex.test(password)) {
        errorMessage = "Password must be at least 8 characters, include uppercase, lowercase, a number, and a special character.";
    } else if (password !== confirm) {
        errorMessage = "Passwords do not match.";
    } else {
        // Check if the email already exists
        const user = await client.db(process.env.DB_NAME).collection(db_table).findOne({ email: email });
        if (user) {
            errorMessage = "Email already exists, please log in.";
        } else {
            // Hash the password and save the new user
            const hashedPassword = await bcrypt.hash(password, 10);
            const profile = { username: username, password: hashedPassword, email: email };

            await client.db(process.env.DB_NAME).collection(db_table).insertOne(profile);
            return res.redirect('/homepage'); // Redirect to homepage if registration is successful
        }
    }
    res.render('userregister', { error: errorMessage });
});



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
                      res.redirect('/homepage')   
                }else{
                    res.status(400).send("incorrect password")
                }
            })
        }else{
            res.status(400).send("user does not exist")
        }
    })

})


// Fetch books from Google Books API
let fetchedBooks = []
async function getGoogleBooks(query) {
    try {
        const response = await axios.get(`${googleBooksAPI}?q=popular&key=${apiKey}`);
        fetchedBooks = response.data.items.map(book => ({
            title: book.volumeInfo.title,
            authors: book.volumeInfo.authors,
            description: book.volumeInfo.description,
            imageLinks:book.volumeInfo.imageLinks? book.volumeInfo.imageLinks.thumbnail : 'https://via.placeholder.com/128x198',
            previewLink: book.volumeInfo.previewLink, 
        })) || [];

        return fetchedBooks 
    } catch (error) {
        console.error('Error fetching books from Google Books API:', error);
        return [];
    }
}

//Home Page with Suggestions
server.get('/homepage', async (req, res) => {
    try {
        const suggestionBooks = await getGoogleBooks('popular');

        if (suggestionBooks.length === 0){
            return res.status(500).send('no books found to save')
        }
        //console.log(suggestionBooks)
       // const feed = await client.db(process.env.DB_NAME).collection(db_table).insertMany(fetchedBooks); // Save suggestions to MongoDB
        res.render('homepage', { "suggestionBooks": fetchedBooks });
        //console.log(fetchedBooks)
    } catch (err) {
        console.error('Error fetching suggestions:', err.message);
        res.status(500).send('Error loading suggestions');
    }
});


// Search Page
let fetchedSearchBooks = [];
server.get('/search', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.render('search', { books: [] });
    try {
        const response = await axios.get(`${googleBooksAPI}?q=${query}&key=${apiKey}`);
        fetchedSearchBooks = response.data.items || [];

        if (fetchedSearchBooks.length === 0) {
            return res.status(500).send('No books found to save');
        }
        // Add a preview link to each book if it exists
        const booksWithPreview = fetchedSearchBooks.map(book => ({
            ...book,
            previewLink: book.volumeInfo.previewLink || '#', 
        }));
        // Save to MongoDB
       // const feed = await client.db(process.env.DB_NAME).collection(db_table).insertMany(booksWithPreview);
        res.render('search', { "books": booksWithPreview });
    } catch (error) {
        console.error('Error searching for books:', error.message);
        res.status(500).send('Error searching for books');
    }
});


// Server route for currently-reading books
let fetchedCurrentlyReadingBooks = [];

server.get('/currently-reading', async (req, res) => {
    try {
        const response = await axios.get(`${googleBooksAPI}?q=current+reading&key=${apiKey}`);
        fetchedCurrentlyReadingBooks = response.data.items || [];

        if (fetchedCurrentlyReadingBooks.length === 0) {
            return res.status(500).send('No books found to save');
        }
        // Include preview links in the fetched books
        const booksWithPreview = fetchedCurrentlyReadingBooks.map(book => {
            return {
                ...book,
                previewLink: book.volumeInfo.previewLink || 'N/A'
            };
        });
        //await client.db(process.env.DB_NAME).collection(db_table).insertMany(booksWithPreview);
        res.render('currently-reading', { "currentlyReadingBooks": booksWithPreview });
    } catch (err) {
        console.error('Error fetching currently reading books:', err.message);
        res.status(500).send('Error loading currently reading books');
    } 
});

// server.get('/currently-reading', async (req, res) => {
//     try {
//         const response = await axios.get(`${googleBooksAPI}?q=current+reading&key=${apiKey}`);
//         fetchedCurrentlyReadingBooks = response.data.items || [];

//         if (fetchedCurrentlyReadingBooks.length === 0) {
//             return res.status(500).send('No books found to save');
//         }
//         const booksWithPreview = fetchedCurrentlyReadingBooks.map(book => ({
//             title: book.volumeInfo.title,
//             authors: book.volumeInfo.authors,
//             description: book.volumeInfo.description,
//             imageLinks: book.volumeInfo.imageLinks ? book.volumeInfo.imageLinks.thumbnail : 'https://via.placeholder.com/128x198',
//             previewLink: book.volumeInfo.previewLink || 'N/A'
//         }));

//         // Filter out books that already exist in the database
//         const newBooks = [];
//         for (const book of booksWithPreview) {
//             const existingBook = await client.db(process.env.DB_NAME).collection(db_table).findOne({ title: book.title, authors: book.authors });
//             if (!existingBook) {
//                 newBooks.push(book);
//             }
//         }

//         // Insert only the new books into MongoDB
//         if (newBooks.length > 0) {
//             await client.db(process.env.DB_NAME).collection(db_table).insertMany(newBooks);
//         }

//         res.render('currently-reading', { "currentlyReadingBooks": booksWithPreview });
//     } catch (err) {
//         console.error('Error fetching currently reading books:', err.message);
//         res.status(500).send('Error loading currently reading books');
//     }
// });

// Want to Read Page
let fetchedWantToReadBooks = [];
server.get('/want-to-read', async (req, res) => {
    try {
        const response = await axios.get(`${googleBooksAPI}?q=want+to+read&key=${apiKey}`);
        fetchedWantToReadBooks = response.data.items || [];

        if (fetchedWantToReadBooks.length === 0) {
            return res.status(500).send('No books found to save');
        }
       //const feed = await client.db(process.env.DB_NAME).collection(db_table).insertMany(fetchedWantToReadBooks);
        res.render('want-to-read', { "wantToReadBooks": fetchedWantToReadBooks });
    } catch (err) {
        console.error('Error fetching want to read books:', err.message);
        res.status(500).send('Error loading want to read books');
    }
});

//admin route
server.get("/admin_elibrary",(req,res)=>{
    res.render("admin_elibrary.ejs")
})

//view users
server.get('/admin/users', async (req, res) => {
    try {
        const users = await client.db(db_name).collection(db_table).find().toArray();
        res.render('manage_user.ejs', { users }); 
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).send('Error fetching users');
    }
});

//delete users
server.post('/admin/users/delete', async (req, res) => {
    const userId = req.body.userId;
    try {
        await client.db(db_name).collection(db_table).deleteOne({ _id: new mongodb.ObjectId(userId) });
        res.redirect('/manage_user'); 
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).send('Error deleting user');
    }
});

//view books
server.get('/admin/books', async (req, res) => {
    try {
        const books = await client.db(db_name).collection('books').find().toArray();
        res.render('manage_books.ejs', { books }); 
    } catch (err) {
        console.error('Error fetching books:', err);
        res.status(500).send('Error fetching books');
    }
});

//add books
server.post('/admin/books/add', async (req, res) => {
    const { title, author, description, imageLinks, previewLink } = req.body;
    const newBook = { title, author, description, imageLinks, previewLink };

    try {
        await client.db(process.env.DB_NAME).collection('books').insertOne(newBook);
        res.redirect('/manage_books'); 
    } catch (err) {
        console.error('Error adding book:', err);
        res.status(500).send('Error adding book');
    }
});

//delete book
server.post('/admin/books/delete', async (req, res) => {
    const bookId = req.body.bookId;
    try {
        await client.db(process.env.DB_NAME).collection('books').deleteOne({ _id: new mongodb.ObjectId(bookId) });
        res.redirect('/manage_books'); 
    } catch (err) {
        console.error('Error deleting book:', err);
        res.status(500).send('Error deleting book');
    }
});

//view statistics
server.get('/admin/stats', async (req, res) => {
    try {
        const totalUsers = await client.db(process.env.DB_NAME).collection(db_table).countDocuments();
        const totalBooks = await client.db(process.env.DB_NAME).collection('books').countDocuments();
        res.render('stats.ejs', { totalUsers, totalBooks });
    } catch (err) {
        console.error('Error fetching statistics:', err);
        res.status(500).send('Error fetching statistics');
    }
});



//connect to the express server  
server.listen(port,()=>{
    console.log(`server is listening on port ${port}`)

})  