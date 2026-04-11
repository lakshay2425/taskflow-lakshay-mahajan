import express from 'express';
const router = express.Router();

router.post("/register", (req,res)=>{
    //Register with name, email, password
    res.status(200).json({
        message: "Register route"
    })
})

router.post("/login", (req,res)=>{
    //Returns a JWT access token
    res.status(200).json({
        message: "Login route"
    })
})


export default router;
