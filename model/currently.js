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
            const userId = req.session.userId; // Assume user ID is stored in the session
            if (!userId) {
                return res.redirect('/login'); // Redirect to login if user is not logged in
            }

            try {
                const user = await client.db(db_name).collection(db_table).findOne({ _id: new mongodb.ObjectId(userId) });
                const currentlyReading = user?.currentlyReading || [];

                const books = await client.db(process.env.DB_NAME).collection(db_table).find({
                    _id: { $in: currentlyReading.map(id => new mongodb.ObjectId(id)) }
                }).toArray();

                res.render('currentlyReading', { books });
            } catch (err) {
                console.error("Error fetching currently reading books:", err);
                res.status(500).send("Internal Server Error");
            }

    })        

}
module.exports = authenticateToken;