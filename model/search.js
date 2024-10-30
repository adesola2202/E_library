const jwt = require("jsonwebtoken")
const axios = require('axios')
const dotenv = require("dotenv")
dotenv.config()

//google books key
const apiKey = process.env.API_KEY
const googleBooksAPI = 'https://www.googleapis.com/books/v1/volumes';



let fetchedSearchBooks = [];
const authenticateToken = (req,res,next) =>{
    const token = req.cookies.token
    if(!token)return res.render("login")
    jwt.verify(token,"secretkey", async(err,user)=>{
        if(err)return res.status(403).json({error:"invalid Token"})
            req.user = user
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
    

}
module.exports = authenticateToken;