const jwt = require("jsonwebtoken")
const axios = require('axios')
const dotenv = require("dotenv")
dotenv.config()

//google books key
const apiKey = process.env.API_KEY
const googleBooksAPI = 'https://www.googleapis.com/books/v1/volumes';



let fetchedCurrentlyReadingBooks = [];
const authenticateToken = (req,res,next) =>{
    const token = req.cookies.token
    if(!token)return res.render("login")
    jwt.verify(token,"secretkey", async(err,user)=>{
        if(err)return res.status(403).json({error:"invalid Token"})
            req.user = user
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
    

}
module.exports = authenticateToken;