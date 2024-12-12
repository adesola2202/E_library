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
        const bookCollection = client.db(db_name).collection(db_table)
        const book = await bookCollection.findOne({ _id: new mongodb.ObjectId(req.params.id) });
    
        if (book) {
            res.render('read-book', { book });
        } else {
            res.status(404).send("Book not found");
        }
        })
}
module.exports = authenticateToken;