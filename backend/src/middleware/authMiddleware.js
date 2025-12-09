const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
    try{
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1] 
        : null;
    
        if (!token) return res.status(401).json({error: "No token provided"});


    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.id) return res.status(401).json({error: "Invalid token"});

    const user = await User.findById(decoded.id).select("-passwordHash");
    if(!user) return res.status(401).json({error: "User not found"});

    req.user = user;
    next(); 
    }
catch(error){
    console.error("Auth Middleware Error:", error.message);
    return res.status(401).json({ error: "Unauthorized"});
}
};

module.exports = authMiddleware;