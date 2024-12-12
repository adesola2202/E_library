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
            // Fetch all books from the database
            const books = await client.db(db_name).collection(db_table).find().toArray();
        
            // Render the homepage view with the books
            res.render('homepage', { books});
        
        } catch (err) {
            console.error('Error fetching books:', err);
            res.status(500).send('Error loading books.');
        }
    })        

}
module.exports = authenticateToken;
