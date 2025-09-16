const express = require("express");
const router = express.Router();
const userModel = require("./../models/models")
const { body,validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const supabase = require('./../config/supabaseClient');



router.get("/",(req,res)=>{
    
    res.render('index')


})

router.post("/form",(req,res)=>{
    console.log(req.body);

    res.send("submitted")
})


router.get("/register",(req,res)=>{
    res.render('register')
})



router.post("/register",[
    body('email').trim().isEmail().isLength({min:13}),
    body('password').trim().isLength({min:5}),
    body('name').trim().isLength({min:3})
], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }

    console.log(req.body);
    const {name, email, password} = req.body;
    const hashPassword = await bcrypt.hash(password, 10);

    // ✅ 1. Create user in database
    const newUser = await userModel.create({
        name: name,
        email: email,
        password: hashPassword,
    });

    // ✅ 2. Create user folder in Supabase (AFTER user is created)
    try {
        const { error } = await supabase.storage
            .from("uploads")
            .upload(`user_${newUser._id}/.keep`, new Buffer.from(''), {
                cacheControl: "3600",
                upsert: true
            });
        
        if (error) {
            console.log("Folder creation note:", error.message);
        }
    } catch (folderError) {
        console.log("Folder creation note:", folderError.message);
    }

    // ✅ 3. Redirect to login
    res.redirect('/home/login');
});




router.get('/users',(req,res)=>{
    userModel.find({
        name:'saubhagya'
    }).then((user)=>{
        res.send(user)
    })
})




router.get("/login",(req,res)=>{
    res.render('login')

})



router.post("/login",
    body('email').trim().isEmail().isLength({min:13}),
    body('password').trim().isLength({min:5}),

   async(req,res)=>{
    const error = validationResult(req)

    if(!error.isEmpty()){
        return res.status(400).json({ errors: errors.array() });


    }

    const {email,password} = req.body;

    const emailId = await userModel.findOne({
       email : email

    })
    if(!emailId){
        return res.status(400).json({
            message:'email incorrect '
        })
    }
    const IsMatch = await bcrypt.compare(password,emailId.password)

    if(!IsMatch){
        return res.status(400).json({
            message:' password is incorrect'

        })

    }

    

    const token = jwt.sign({
      id: emailId._id,
      email:emailId.email,
       name: emailId.name


    },process.env.JWT_SECRET,
 )
 res.cookie('token',token)
 res.redirect('/home/get-rows')



})



// Show all uploaded files from Supabase bucket (root + subfolders)
// Show all uploaded files from Supabase bucket
router.get("/get-rows", async (req, res) => {
  try {
    // List all files (without recursive folder logic)
    const { data: files, error } = await supabase.storage
      .from("uploads")
      .list(`user_${req.user.id}/`, { 
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }        //order: 'asc' (A-Z, 0-9) or 'desc' (Z-A, 9-0)
      });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Get public URLs for all files                        //List files → Get file metadata (names, dates, etc.)
    const fileUrls = files.map(file => {
      const { data } = supabase.storage.from("uploads").getPublicUrl(`user_${req.user.id}/${file.name}`);     //getPublicUrl() generates a special link that allows public access      it returns //--> data = { publicUrl: "https://xyz.supabase.co/storage/v1/object/public/uploads/filename.jpg" }
      return {    
        name: file.name, 
        url: data.publicUrl,                                  // // 2. Create a new object with the data we want to send to EJS
        created_at: file.created_at,
       
         
      };
    });

    res.render("first", { files: fileUrls, user: req.user  });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// router.get("/files", async (req, res) => {
//   try {
//     const { data: files, error } = await supabase.storage
//       .from("uploads")
//       .list("public"); // folder name

//     if (error) {
//       return res.status(400).send("Unable to fetch files");
//     }

//     // send to ejs
//     res.render("first", { files: files.map(f => f.name) });
//   } catch (err) {
//     res.status(500).send(err.message);
//   }
// });



module.exports = router;



