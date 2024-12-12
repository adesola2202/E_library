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
            const userId = req.session.userId;

            if (!userId) {
                return res.status(401).send('User not logged in.');
            }

            try {
                const user = await client.db(db_name).collection(db_table).findOne(
                    { _id: new mongodb.ObjectId(userId) },
                    { projection: { wishlist: 1 } }
                );

                const wishlist = user?.wishlist || [];
                if (wishlist.length === 0) {
                    return res.render('wantToRead', { books: [] });
                }

                // Fetch book details
                const books = await client.db(db_name).collection(db_table).find({
                    _id: { $in: wishlist }
                }).toArray();

                res.render('wantToRead', { books });
            } catch (error) {
                console.error('Error fetching wishlist:', error);
                res.status(500).send('Failed to fetch wishlist.');
            }    

        })
}
module.exports = authenticateToken;







