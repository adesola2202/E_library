const jwt = require("jsonwebtoken")
const axios = require('axios')
const dotenv = require("dotenv")
dotenv.config()

//google books key
const apiKey = process.env.API_KEY
const googleBooksAPI = 'https://www.googleapis.com/books/v1/volumes';


// Fetch books from Google Books API
async function getGoogleBooks(query) {
    try {
        const response = await axios.get(`${googleBooksAPI}?q=popular&key=${apiKey}`);
        //  console.log(response.data.items[0].id)
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

let fetchedBooks = [];
const authenticateToken = (req,res,next) =>{
    const token = req.cookies.token
    if(!token)return res.render("login")
    jwt.verify(token,"secretkey", async(err,user)=>{
        if(err)return res.status(403).json({error:"invalid Token"})
            req.user = user
            try {
                const suggestionBooks = await getGoogleBooks('popular');
                //console.log('fetchedBooks:', suggestionBooks)
            
                if (suggestionBooks.length === 0){
                    return res.status(500).send('no books found to save')
                }
                //console.log(suggestionBooks)
            // const feed = await client.db(process.env.DB_NAME).collection(db_table).insertMany(fetchedBooks); // Save suggestions to MongoDB
                res.render('homepage',{ "suggestionBooks":fetchedBooks});
                //console.log(fetchedBooks)
            } catch (err) {
                console.error('Error fetching suggestions:', err.message);
                res.status(500).send('Error loading suggestions');
            }
        })
}
module.exports = authenticateToken;