const jwt = require("jsonwebtoken")
const axios = require('axios')
const dotenv = require("dotenv")
dotenv.config()

//google books key
const apiKey = process.env.API_KEY
const googleBooksAPI = 'https://www.googleapis.com/books/v1/volumes';



let fetchedWantToReadBooks = [];
const authenticateToken = (req,res,next) =>{
    const token = req.cookies.token
    if(!token)return res.render("login")
    jwt.verify(token,"secretkey", async(err,user)=>{
        if(err)return res.status(403).json({error:"invalid Token"})
            req.user = user
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
    

}
module.exports = authenticateToken;