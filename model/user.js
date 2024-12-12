const jwt = require("jsonwebtoken")
const mongodb = require("mongodb")
const dotenv = require("dotenv")
const client =new mongodb.MongoClient(process.env.DB_URL)
dotenv.config()
const db_name = process.env.DB_NAME
const db_table = process.env.DB_TABLE
const fs = require('fs');
const jsonDataPath = './books.json';


// Load JSON data and save to MongoDB
async function loadAndSaveBooks() {
    const bookCollection =  client.db(db_name).collection(db_table) ;
    try {
        const data = fs.readFileSync(jsonDataPath, 'utf8');
        const books = JSON.parse(data);
   
        // Insert books if they don’t already exist
        for (let book of books) {
            const existingBook = await bookCollection.findOne({ title: book.title });
            if (!existingBook) {
                await bookCollection.insertOne(book);
                console.log(`Inserted book: ${book.title}`);
            } else {
                console.log(`Book already exists: ${book.title}`);
            }
        }
    } catch (error) {
        console.error('Error loading books:', error);
    }
}
loadAndSaveBooks();
const authenticateToken = (req,res,next) =>{
    const token = req.cookies.token
    if(!token)return res.render("login")
    jwt.verify(token,"secretkey", async(err,user)=>{
        if(err)return res.status(403).json({error:"invalid Token"})
            req.user = user         
            try {
                const bookCollection = client.db(process.env.DB_NAME).collection(db_table);
                const books = await bookCollection.find().toArray(); // Fetch all books from MongoDB

                // Extract all book IDs
                const bookIds = books.map(book => book._id);
                // Save the book IDs in the session
                req.session.bookIds = bookIds; 
            
                const userId = req.userId
                // Render the books to an EJS page (e.g., 'books.ejs')
                res.render('homepage', { books,userId });
                
            } catch (error) {
                console.error('Error loading books:', error);
                res.status(500).send("Error loading books.");
            }
        })
}
module.exports = authenticateToken;
