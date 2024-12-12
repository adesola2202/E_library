const jwt = require("jsonwebtoken")
const mongodb = require("mongodb")
const dotenv = require("dotenv")
dotenv.config()
const client =new mongodb.MongoClient(process.env.DB_URL)
const db_name = process.env.DB_NAME
const db_table = process.env.DB_TABLE
 

const authenticateToken = (req,res,next) =>{
    const token = req.cookies.token
    if(!token)return res.render("login")
        
    jwt.verify(token,"secretkey", async(err,user)=>{
        if(err)return res.status(403).json({error:"invalid Token"})
            req.user = user 
        try {
            const searchTerm = req.query.q ? req.query.q.trim() : ''; // Get query from URL parameter and trim it
            if (!searchTerm) {
                return res.render('search', { books: [], message: 'Please enter a search term.' });
            }
        
            // Search for books by title or author
            const books = await client.db(db_name).collection(db_table).find({
                $or: [
                    { title: { $regex: searchTerm, $options: 'i' } }, // Case-insensitive match for title
                    { author: { $regex: searchTerm, $options: 'i' } } // Case-insensitive match for author
                ]
            }).toArray();
        
            // Check if books were found
            if (books.length === 0) {
                return res.render('search', { books: [], message: 'No books found.' });
            }
        
            // Render the search results with the books
            res.render('search', { books, message: null });
        } catch (error) {
            console.error('Error fetching books:', error);
            res.status(500).render('search', { books: [], message: 'An error occurred. Please try again later.' });
        }

    })        

}
module.exports = authenticateToken;