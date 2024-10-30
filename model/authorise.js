const jwt = require("jsonwebtoken")
const authenticateToken = (req,res,next) =>{
    const token = req.cookies.token
    if(!token)return res.render("login")
        jwt.verify(token,"secretkey",(err,user)=>{
    if(err)return res.status(403).json({error:"invalid Token"})
        req.user = user
        res.render("admin/dashboard")
    })
}
module.exports = authenticateToken;