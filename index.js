const express = require("express") // it simplifies craeting web server
const server = express() // create varaiable to hold the application
const cors = require("cors") //accept share resource with other domain 
const mongodb = require("mongodb")// Nosql thats uses json like document
const dotenv = require("dotenv")//configuration file to store secret 
dotenv.config()
const bcrypt = require("bcrypt")// to ehance security 
const cloudinary = require("cloudinary").v2 // cloud storange 
const client =new mongodb.MongoClient(process.env.DB_URL);
const path = require("path")
const cookieParser = require("cookie-parser") 
const bodyParser = require("body-parser")
const session = require("express-session")
const auth = require("./model/authorise")
const authenticate = require("./model/admi")
const authent= require("./model/read") 
const authen= require("./model/homepage")
const authenti= require("./model/currently")
const authentic= require("./model/search")
const aut= require("./model/want")
const au= require("./model/user")
const jwt = require("jsonwebtoken")
const fs = require("fs")
const multer = require('multer');
server.use(
    session({
        secret:"keyboard",
        resave:false,
        saveUninitialized:true
    })
)
// use middleware
server.use(cookieParser())
server.use(express.static(path.join(__dirname,"public/")))
server.use(cors())
server.use(bodyParser.urlencoded({extended:true}))// allows nested object in the request body
server.set("view engine","ejs")



//read the connection inside of the dotenv
const port = process.env.PORT || 3000
const db_name = process.env.DB_NAME
const db_table = process.env.DB_TABLE
const apiKey = process.env.CLOUDINARY_KEY
const secret = process.env.CLOUDINARY_SECRET
const cloudName = process.env.CLOUDINARY_CLOUD_NAME

cloudinary.config({
    cloud_name :cloudName,
    api_key:apiKey,
    api_secret:secret
})

//multer
const img = path.join(__dirname, 'public/images/uploaded')
const storage = multer.diskStorage({
    destination:(req,file,callback)=>{
        callback(null,img)
    },
    filename:(req,file,callback)=>{
        callback(null,file.originalname)
    }
})
//activate multer storage setting
const upload = multer({storage:storage }); 


// Connect to MongoDB
let dbConnected = false;
async function connectToDatabase() {
    try {
        await client.connect();
        console.log("Connected to MongoDB");
        dbConnected = true; // Update flag when connected

    } catch (error) {
        console.error("Failed to connect to MongoDB:", error);
    }
}
// Call function to connect to the database
connectToDatabase();


// Login route
server.get("/login",(req,res)=>{
    res.render("login.ejs", {message:null})
})

server.post("/login", async (req, res) => {
    const email = req.body.email.trim();
    const password = req.body.password.trim();
    
    // Check if email or password is empty
    if (!email || !password) {
        return res.render('login', { message: "Please fill in all the fields." });
    }

    try {
        const savedUser = await client.db(db_name).collection(db_table).findOne({ email: email });

        if (!savedUser) {
            return res.render('login', { message: "Invalid email or password." });
        }

        // Compare the entered password with the hashed password in the database
        const doMatch = await bcrypt.compare(password, savedUser.password);
        
        if (!doMatch) {
            // If the password doesn't match, return an error
            return res.render('login', { message: "Invalid email or password." });
        }

        // Check if the user is an admin
        if (savedUser.isAdmin) {
            const token = jwt.sign({ _id: savedUser._id }, "secretkey", { expiresIn: '1h' }); // Generate token
            res.cookie("token", token, { httpOnly: true }); // Send token as cookie with name 'token'
            req.session.user = token;
            return res.redirect("/holyland/admin");
        } else {
            const token = jwt.sign({ _id: savedUser._id }, "secretkey");
            res.cookie("token", token, { httpOnly: true });
            req.session.userId = savedUser._id.toString(); // Store user ID in session as a string
            return res.redirect("/homepage");
        }
    } catch (error) {
        console.error('Error during login:', error);
        return res.render('login', { message: "An error occurred. Please try again." });
    }
});



server.post("/logout", (req, res) => {
    // Clear the session (if any)
    req.session?.destroy((err) => {
        if (err) {
            console.error("Error clearing session:", err);
            return res.status(500).json({ message: "Logout failed" });
        }

        // Clear the token from cookies
        res.clearCookie("token", { path: "/" }); // Adjust the path if needed
        res.redirect("/login")
    });
});

      
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
    res.render("admin.ejs")
})

server.get("/holyland/e-library",(req,res)=>{
    res.render("e-library.ejs")
})

// Route to display books to users
server.get('/homepage',authen,async (req, res) => {

});


// Route to display a single book for reading
server.get('/read/:id', authent,async (req, res) => {

});


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

    // Validate inputs
    if (!username || !email || !password || !confirm) {
        errorMessage = "Please fill in all fields.";
    } else if (password !== confirm) {
        errorMessage = "Passwords do not match.";
    } else {
        const user = await client.db(db_table).collection(db_table).findOne({ email: email });
        if (user) {
            errorMessage = "Email already exists, please log in.";
        }
    }
    // Render the registration form with error message if any
    if (errorMessage) {
        return res.render('userregister', { error: errorMessage });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const profile = { username: username, isAdmin: false, password: hashedPassword, email: email };
        const result = await client.db(process.env.DB_NAME).collection(db_table).insertOne(profile);

        // Generate JWT token
        const token = jwt.sign({ userId: result.insertedId, username: profile.username }, "secretkey", { expiresIn: '1h' });

        // Store token in a cookie
        res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' }); // Use secure flag in production

        return res.redirect('/homepage');
    } catch (error) {
        console.error('Error during user registration:', error);
        return res.status(500).send("Error during user registration");
    }
});

  

server.post('/add-to-want-to-read', async (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
        console.error('User ID not found in session');
        return res.status(401).send('User not logged in.');
    }

    const bookId = req.body.bookId;

    try {
        // Add the book ID to the user's wishlist, ensuring it is unique
        await client.db(process.env.DB_NAME).collection(db_table).updateOne(
            { _id: new mongodb.ObjectId(userId) },
            { $addToSet: { wishlist: new mongodb.ObjectId(bookId) } }, // Ensure book IDs are ObjectIds
            { upsert: true } // Create the user document if it doesn't exist
        );

        res.redirect('/want-to-read');
    } catch (error) {
        console.error('Error adding to wishlist:', error);
        res.status(500).send('Failed to add to wishlist.');
    }
});



server.get('/want-to-read', aut,async (req, res) => {

});

server.post('/remove-from-want-to-read', async (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
        return res.status(401).send('User not logged in.');
    }

    const bookId = req.body.bookId;

    try {
        // Remove the book ID from the user's wishlist
        await client.db(db_name).collection(db_table).updateOne(
            { _id: new mongodb.ObjectId(userId) },
            { $pull: { wishlist: new mongodb.ObjectId(bookId) } } // Remove book ID from wishlist
        );

        res.redirect('/want-to-read'); // Redirect back to the want-to-read page
    } catch (error) {
        console.error('Error removing from wishlist:', error);
        res.status(500).send('Failed to remove from wishlist.');
    }
});




server.get("/currently-reading", authenti,async (req, res) => {

});


server.get('/add-to-currently-reading/:id', async (req, res) => {
    const bookId = req.params.id;
    const userId = req.session.userId; // Assume user ID is stored in the session

    if (!userId) {
        return res.redirect('/login'); // Redirect to login if user is not logged in
    }

    try {
        const user = await client.db(db_name).collection(db_table).findOne({ _id: new mongodb.ObjectId(userId) });
        const currentlyReading = user?.currentlyReading || [];

        // Add the book to the list if it's not already there
        if (!currentlyReading.includes(bookId)) {
            currentlyReading.push(bookId);

            await client.db(db_name).collection(db_table).updateOne(
                { _id: new mongodb.ObjectId(userId) },
                { $set: { currentlyReading } }
            );
        }

        res.redirect('/currently-reading');
    } catch (err) {
        console.error("Error adding book to currently reading:", err);
        res.status(500).send("Internal Server Error");
    }
});




server.get('/remove-from-currently-reading/:id', async (req, res) => {
    const bookId = req.params.id;
    const userId = req.session.userId;

    if (!userId) {
        return res.redirect('/login');
    }

    try {
        const user = await client.db(db_name).collection(db_table).findOne({ _id: new mongodb.ObjectId(userId) });
        const currentlyReading = user?.currentlyReading || [];

        const updatedList = currentlyReading.filter(id => id !== bookId);

        await client.db(db_name).collection(db_table).updateOne(
            { _id: new mongodb.ObjectId(userId) },
            { $set: { currentlyReading: updatedList } }
        );

        res.redirect('/currently-reading');
    } catch (err) {
        console.error("Error removing book from currently reading:", err);
        res.status(500).send("Internal Server Error");
    }
});

// Search books endpoint
server.get('/search', authentic,async (req, res) => {

});

// Admin route to view all books with edit and delete options
server.get('/admin/books',authenticate, async (req, res) => {

});


server.post('/admin/delete-book/:id', async (req, res) => {
    const bookId = req.params.id;

    try {
        await client.db(db_name).collection(db_table).deleteOne({ _id: new mongodb.ObjectId(bookId) });

        res.redirect('/admin/books'); 
    } catch (err) {
        console.error('Error deleting book:', err);
        res.status(500).send('Failed to delete book.');
    }
});


// Route to display the add book form
server.get('/admin/add-book', (req, res) => {
    res.render('add-book');  // Render the add book form page
});

// Route to add a new book with validation
server.post('/admin/add-book', upload.fields([{ name: 'Imgupload' }, { name: 'Pdfupload' }]), async (req, res) => {
    

    const { title, author, description } = req.body;
    const imagePath = req.files?.Imgupload[0]?.path;  // Image file path
    const pdfPath = req.files?.Pdfupload[0]?.path;  // PDF file path

    if (!title || !author || !description || !imagePath || !pdfPath) {
        console.log('Missing required fields:', { title, author, description, imagePath, pdfPath });
        return res.status(400).send('All fields, including image and PDF, are required.');
    }

   

    try {
        // Upload the image to Cloudinary
        const cloudinaryResult = await cloudinary.uploader.upload(imagePath, {
            folder: "sample", 
        });
        console.log('Cloudinary image upload result:', cloudinaryResult);

        
        // Dynamically generate the relative path for the PDF
        const pdfFileName = path.basename(pdfPath); // Extract file name (e.g., Sass.pdf)
        const pdfRelativePath = path.join('/images/uploaded', pdfFileName).replace(/\\+/g, '/');  // Ensure forward slashes


        // Save the new book to MongoDB
        const newBook = {
            title,
            author,
            description,
            image: cloudinaryResult.secure_url,
            book_content: pdfRelativePath,  // Save the dynamic relative path
            createdAt: new Date(),
        };

        console.log('Book to insert:', newBook);

        await client.db(db_name).collection(db_table).insertOne(newBook);
        console.log("Book added successfully:", newBook);

        //  delete the local files after processing
        fs.unlinkSync(imagePath);  // Delete the image file after upload to Cloudinary
        //fs.unlinkSync(pdfPath);    // Delete the PDF file after saving to database

        // Redirect to view books page
                res.redirect('/admin/books');
    } catch (error) {
        console.error('Error adding book:', error);
        res.status(500).send('Failed to add book. Please try again.');
    }
});




server.get('/admin/edit-book/:id', async (req, res) => {
    const bookId = req.params.id;

    try {
        const book = await client.db(db_name).collection(db_table).findOne({ _id: new mongodb.ObjectId(bookId) });
        if (!book) return res.status(404).send('Book not found.');

        res.render('editBook', { book });
    } catch (err) {
        console.error('Error fetching book for editing:', err);
        res.status(500).send('Failed to load book for editing.');
    }
});



server.post('/admin/edit-book/:id', upload.fields([{ name: 'Imgupload' }, { name: 'Pdfupload' }]), async (req, res) => {
    const bookId = req.params.id;
    const { title, author, description } = req.body;
    const imagePath = req.files?.Imgupload ? req.files.Imgupload[0]?.path : null;
    const pdfPath = req.files?.Pdfupload ? req.files.Pdfupload[0]?.path : null;

    try {
        // Fetch the existing book
        const book = await client.db(db_name).collection(db_table).findOne({ _id: new mongodb.ObjectId(bookId) });
        if (!book) {
            return res.status(404).send('Book not found.');
        }

        // Prepare updated fields
        let updatedFields = { title, author, description };

        // If a new image is uploaded, replace it
        if (imagePath) {
            // Upload the new image to Cloudinary
            const cloudinaryResult = await cloudinary.uploader.upload(imagePath, { folder: "sample" });
            updatedFields.image = cloudinaryResult.secure_url;

            // Delete the local image file
            fs.unlinkSync(imagePath);
        } else {
            updatedFields.image = book.image; // Keep the old image if no new image is uploaded
        }

        // If a new PDF is uploaded, replace it
        if (pdfPath) {
            const pdfFileName = path.basename(pdfPath); // Extract file name (e.g., `book.pdf`)
            const pdfRelativePath = path.join('/images/uploaded', pdfFileName).replace(/\\+/g, '/'); // Generate relative path
            updatedFields.book_content = pdfRelativePath;

            // Delete the local PDF file
            //fs.unlinkSync(pdfPath);
        } else {
            updatedFields.book_content = book.book_content; // Keep the old PDF path if no new PDF is uploaded
        }

        // Update the book in the database
        const result = await client.db(db_name).collection(db_table).updateOne(
            { _id: new mongodb.ObjectId(bookId) },
            { $set: updatedFields }
        );

        // Check if the update was successful
        if (result.matchedCount === 0) {
            return res.status(404).send('Failed to update book. Book not found.');
        }

        console.log('Book updated successfully:', updatedFields);

        res.redirect('/admin/books');
    } catch (err) {
        console.error('Error updating book:', err);
        res.status(500).send('Failed to update book.');
    }
});





//connect to the express server  
server.listen(port,()=>{
    console.log(`server is listening on port ${port}`)

}) 