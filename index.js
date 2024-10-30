const express = require("express")
const server = express()
const cors = require("cors")
const mongodb = require("mongodb")
const dotenv = require("dotenv")
const bcrypt = require("bcrypt")
dotenv.config()
const client =new mongodb.MongoClient(process.env.DB_URL)
const path = require("path")
const cookieParser = require("cookie-parser") 
const bodyParser = require("body-parser")
const session = require("express-session")
const axios = require('axios')
const auth = require("./model/authorise")
const auths = require("./model/user")
const authent= require("./model/user")
const authen = require("./model/currently")
const authenticate = require("./model/search")
const jwt = require("jsonwebtoken")
const mongoose = require("mongoose")
server.use(
    session({
        secret:"keyboard",
        resave:false,
        saveUninitialized:true
    })
)
// use middleware
server.use(cookieParser())
server.use(express.json())
server.use(express.static(path.join(__dirname,"public/")))
server.use(cors())
server.use(bodyParser.urlencoded({extended:true}))
const user = require("./model/user")
const authenticateToken = require("./model/authorise")
const { log } = require("console")
server.set("view engine","ejs")



//read the connection inside of the dotenv
const port = process.env.PORT || 3000
const db_name = process.env.DB_NAME
const db_table = process.env.DB_TABLE


//google books key
const apiKey = process.env.API_KEY
const googleBooksAPI = 'https://www.googleapis.com/books/v1/volumes';

// Regular expressions
 const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Password must be at least 8 characters long and contain at least one uppercase letter,one lowercase letter and one number.
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;


// Track connection status
let dbConnected = false;

// Connect to MongoDB
async function connectToDatabase() {
    try {
        await client.connect();
        console.log("Connected to MongoDB");
        dbConnected = true; // Update flag when connected
        await preRegisterAdmin(); // Pre-register the admin after connecting
    } catch (error) {
        console.error("Failed to connect to MongoDB:", error);
    }
}

// Function to pre-register the admin
async function preRegisterAdmin() {
    const adminCollection = client.db(process.env.DB_NAME).collection(db_table);

    const adminEmail = 'adesolaadekola@gmail.com';
    const adminPassword = 'Password123';
    

    const existingAdmin = await adminCollection.findOne({ email: adminEmail });
    if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        const admin = {
            username: 'admin',
            email: adminEmail,
            password: hashedPassword,
            role: 'admin'
        };
        await adminCollection.insertOne(admin);
        console.log('Admin registered successfully');
    } else {
        console.log('Admin already exists');
    }
}

// Call function to connect to the database
connectToDatabase();

server.get("/login",(req,res)=>{
    res.render("login.ejs")
})

// Login route
server.post("/login", async(req, res) => {
   const email = req.body.email.trim();
   console.log(email)
   const password = req.body.password.trim();
    if (!email ||!password) {
    return res.status(422).json({ error: "please fill the data" });
    }
    await client.db(process.env.DB_NAME).collection(db_table).findOne({ email: email }).then((savedUser) => {
    if(savedUser["isAdmin" ]){
      if(savedUser["email"] == email){
    bcrypt.compare(password, savedUser.password).then((doMatch) => {
    if (doMatch) {
    const token = jwt.sign({ _id: savedUser._id }, "secretkey", { expiresIn: '1h'});
    const {_id, name, email } = savedUser; 
    res.cookie("token", token, {httpOnly: true})
     req.session.user = token
     res.redirect("/holyland/admin");
    }
    else{
    return res.status(422).json({ error: "invalid email or password" });
    }
  })
  }
    }else{
        const token = jwt.sign({_id:savedUser._id},"secretkey");
           const{_id,name,email} = savedUser
           res.cookie("token",token,{httpOnly:true})
           req.session.user = token
           res.redirect("/homepage")
    }
})
})

server.post("/logout", (req,res)=>{
    session.clear
    res.redirect("/login")
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

server.get("/holyland/admin",auth,(req,res)=>{
    res.render("admin/dashboard.ejs")
})

server.get("/holyland/e-library",(req,res)=>{
    res.render("e-library.ejs")
})


server.get("/userregister",(req,res)=>{
    res.render("userregister", {error:null})
})

// User Registration Endpoint
server.post("/userregister", async (req, res) => {
    const username = req.body.username.trim();
    const email = req.body.email.trim();
    const password = req.body.password.trim();
    const confirm = req.body.confirm.trim();
    let errorMessage = null;

    // Validate email and password
    if (!emailRegex.test(email)) {
        errorMessage = "Invalid email format.";
    } else if (!passwordRegex.test(password)) {
        errorMessage = "Password must be at least 8 characters long and contain at least one uppercase letter,one lowercase letter and one number.";
    } else if (password !== confirm) {
        errorMessage = "Passwords do not match.";
    } else {
        const user = await client.db(process.env.DB_NAME).collection(db_table).findOne({ email: email });
        if (user) {
            errorMessage = "Email already exists, please log in.";
        }
    }
    if (errorMessage) {
        return res.render('userregister', { error: errorMessage });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const profile = { username: username,isAdmin:false, password: hashedPassword, email: email };
        await client.db(process.env.DB_NAME).collection(db_table).insertOne(profile);
        return res.redirect('/homepage');
    } catch (error) {
        console.error('Error during user registration:', error);
        return res.status(500).send("Error during user registration");
    }
});



//Home Page with Suggestions
server.get('/homepage', auths,async (req, res) => {
});

// Search Page
server.get('/search',authenticate, async (req, res) => {
});

// Server route for currently-reading books
server.get('/currently-reading',authen,async (req, res) => {
})

// Want to Read Page
server.get('/want-to-read',authent, async (req, res) => {
});

// Get all books from the database
server.get('/admin/get-all-books', async (req, res) => {
    try {
        const allBooks = await client.db(process.env.DB_NAME).collection(db_table).find({}).toArray();
        res.json(allBooks); // Respond with the list of all books as JSON
        //console.log(allBooks);
        
    } catch (err) {
        console.error('Error fetching all books:', err.message);
        res.status(500).send('Error fetching all books');
    }
});

//admin route
// server.get("/admin/elibrary",(req,res)=>{
//     res.render("admin_elibrary.ejs")
// })


// Admin Dashboard Route
server.get('/admin/elibrary', async (req, res) => {
    try {
        const books = await client.db(process.env.DB_NAME).collection(process.env.DB_TABLE).find({}).toArray();
        const users = await client.db(process.env.DB_NAME).collection(process.env.DB_TABLE)
            .find({ username: { $exists: true, $ne: "" }, email: { $exists: true, $ne: "" } }) // Ensure username and email are not empty
            .toArray();
        res.render('admin_elibrary', { books, users, message: "" });
    } catch (error) {
        console.error('Error fetching data for admin:', error);
        res.status(500).send('Error loading admin dashboard');
    }
});

// Get Add New Book Form
server.get('/admin/add', (req, res) => {
    const message = req.query.message || null;
    res.render('add', { message });
});


// POST route for adding a book
server.post('/admin/add', async (req, res) => {
    const newBook = {
        volumeInfo: {
            title: req.body.title,
            authors: req.body.authors.split(',').map(author => author.trim()),
            description: req.body.description,
            imageLinks: { thumbnail: req.body.imageLink },
            previewLink: req.body.previewLink
        }
    };

    try {
        // Insert the new book into the database
        const result = await client.db(process.env.DB_NAME).collection(db_table).insertOne(newBook);

        if (result.insertedId) {
            console.log('Book added successfully:', newBook.volumeInfo.title);  // Log success in the terminal

            // Fetch the updated list of books to show on the page
            const books = await client.db(process.env.DB_NAME).collection(db_table).find({}).toArray();
            const message = "Book added successfully!";
            res.render('admin_elibrary', { books, message });
        } else {
            console.log('Failed to add book.');
            const books = await client.db(process.env.DB_NAME).collection(db_table).find({}).toArray();
            const message = "Error adding the book.";
            res.render('admin_elibrary', { books, message });
        }
    } catch (error) {
        console.error('Error adding book:', error);
        const books = await client.db(process.env.DB_NAME).collection(db_table).find({}).toArray();
        const message = "Error adding the book.";
        res.render('admin_elibrary', { books, message });
    }
});



// Get Edit Form
server.get('/admin/edit/:id', async (req, res) => {
    const bookId = req.params.id;

    try {
        // Fetch the book by its ObjectId
        const book = await client.db(process.env.DB_NAME).collection(db_table).findOne({ _id: new mongodb.ObjectId(bookId) });

        if (!book) {
            return res.status(404).send("Book not found");
        }

        // Render the edit page with the book data
        res.render('edit', { book, message: null });
    } catch (err) {
        console.error('Error fetching book for edit:', err);
        res.status(500).send("Error fetching book for edit");
    }
});



// Update Book
server.post('/admin/update/:id', async (req, res) => {
    const bookId = new mongodb.ObjectId(req.params.id);  // Book ID for updating
    const updatedBook = {
        volumeInfo: {
            title: req.body.title,
            authors: req.body.authors.split(',').map(author => author.trim()),
            description: req.body.description,
            imageLinks: { thumbnail: req.body.imageLink },
            previewLink: req.body.previewLink
        }
    };

    try {
        // Update the book in the database
        const result = await client.db(process.env.DB_NAME).collection(db_table).updateOne(
            { _id: bookId },
            { $set: updatedBook }
        );

        if (result.modifiedCount > 0) {
            console.log(`Book with ID ${bookId} updated successfully`);  // Log success in the terminal

            // Fetch the updated list of books to display
            const books = await client.db(process.env.DB_NAME).collection(db_table).find({}).toArray();
            const message = "Book updated successfully!";
            res.render('admin_elibrary', { books, message });
        } else {
            console.log(`No changes made to the book with ID ${bookId}`);
            const books = await client.db(process.env.DB_NAME).collection(db_table).find({}).toArray();
            const message = "No changes were made to the book.";
            res.render('admin_elibrary', { books, message });
        }
    } catch (error) {
        console.error('Error updating book:', error);
        const books = await client.db(process.env.DB_NAME).collection(db_table).find({}).toArray();
        const message = "Error updating the book.";
        res.render('admin_elibrary', { books, message });
    }
});
// Delete a book
server.post('/admin/delete/:id', async (req, res) => {
    const bookId = req.params.id;

    try {
        // Attempt to delete the book by its _id
        const result = await client.db(process.env.DB_NAME).collection(db_table).deleteOne({ _id: new mongodb.ObjectId(bookId) });

        if (result.deletedCount === 1) {
            // Log success message to the terminal
            console.log(`Book with ID ${bookId} deleted successfully`);

            // Fetch the updated list of books and pass success message
            const books = await client.db(process.env.DB_NAME).collection(db_table).find({}).toArray();
            const message = "Book deleted successfully!";
            res.render('admin_elibrary', { books, message });
        } else {
            // Log failure if the book was not found
            console.log(`No book found with ID ${bookId} to delete`);
            const books = await client.db(process.env.DB_NAME).collection(db_table).find({}).toArray();
            const message = "Book not found. Unable to delete.";
            res.render('admin_elibrary', { books, message });
        }
    } catch (error) {
        console.error('Error deleting book:', error);
        const books = await client.db(process.env.DB_NAME).collection(db_table).find({}).toArray();
        const message = "Error deleting the book.";
        res.render('admin_elibrary', { books, message });
    }
});

server.get("/admin/users/add",(req,res)=>{
    res.render("add_user",{message: ""}) 
})


// Add a new user
server.post('/admin/users/add', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await client.db(process.env.DB_NAME).collection(process.env.DB_TABLE).insertOne({ username, email, password: hashedPassword });
        console.log('User added successfully');
        const books = await client.db(process.env.DB_NAME).collection(process.env.DB_TABLE).find({}).toArray();
        const users = await client.db(process.env.DB_NAME).collection(process.env.DB_TABLE)
            .find({ username: { $exists: true, $ne: "" }, email: { $exists: true, $ne: "" } })
            .toArray();
        res.render('add_user', { books, users, message: 'User added successfully!' });
    } catch (error) {
        console.error('Error adding user:', error);
        res.status(500).send('Error adding user');
    }
});


// Delete a user
server.post('/admin/users/delete/:id', async (req, res) => {
    const userId = req.params.id;
    try {
        await client.db(process.env.DB_NAME).collection(process.env.DB_TABLE).deleteOne({ _id: new mongodb.ObjectId(userId) });
        console.log('User deleted successfully');
        const books = await client.db(process.env.DB_NAME).collection(process.env.DB_TABLE).find({}).toArray();
        const users = await client.db(process.env.DB_NAME).collection(process.env.DB_TABLE)
            .find({ username: { $exists: true, $ne: "" }, email: { $exists: true, $ne: "" } })
            .toArray();
        res.render('admin_elibrary', { books, users, message: 'User deleted successfully!' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).send('Error deleting user');
    }
});

//connect to the express server  
server.listen(port,()=>{
    console.log(`server is listening on port ${port}`)

})  