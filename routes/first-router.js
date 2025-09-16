const express = require("express");
const router = express.Router();
const multer = require("multer");
const supabase = require("../config/supabaseClient"); // adjust path if needed
const fs = require("fs");
const path = require("path");
const userModel = require("./../models/models")




//Configure multer to save files into "uploads" folder
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});




// Setup multer (to handle file parsing before uploading to Supabase)
const upload = multer({ storage: multer.memoryStorage() });




router.get("/first", (req, res) => {
  res.render("first");
});



// Handle file upload
// router.post("/upload-file", upload.single("file"), async (req, res) => {
//   try {
//     const file = req.file;
//     if (!file) return res.status(400).json({ success: false, error: "No file uploaded" });


//      const MAX_STORAGE = 5 * 1024 * 1024 * 1024; // 5GB in bytes
//         if (req.user.storageUsed + file.size > MAX_STORAGE) {
//             return res.status(400).json({ 
//                 success: false, 
//                 error: "Storage limit exceeded (5GB max)" 
//             });
//         }


//         try {


//   // Check if user folder exists by trying to list it
//   const { data: folderCheck, error: folderError } = await supabase.storage
//     .from("uploads")
//     .list(`user_${req.user.id}/`);
//     // console.log(req.user.id);
  
//   // If folder doesn't exist, create it
//   if (folderError && folderError.message.includes("not found")) {
//     await supabase.storage
//       .from("uploads")
//       .upload(`user_${req.user.id}/.keep`, new Buffer.from(''));
//   }
// } catch (folderError) {
//   console.log("Folder check:", folderError.message);
// }





//     const fileName = `${Date.now()}-${file.originalname}`;
//     const fileBuffer = file.buffer;



//   const { data, error } = await supabase.storage
//   .from("uploads")
//   .upload(`user_${req.user.id}/${fileName}`, fileBuffer, { 
//     cacheControl: "3600", 
//     upsert: false 
//   });

// if (error) return res.status(400).json({ success: false, error: error.message+"good bro" });

// // ✅ FIX 1: Get public URL with user folder path
// const { data: publicData } = supabase.storage
//   .from("uploads")
//   .getPublicUrl(`user_${req.user.id}/${fileName}`); // ← ADD USER FOLDER




// // ✅ FIX 2: Update user's storage usage
//  try {
//       await userModel.findByIdAndUpdate(req.user.id, {
//         $inc: { storageUsed: file.size }
//       });
//     } catch (updateError) {
//       console.log("❌ Storage update failed:", updateError.message);
//         console.log("User ID:", req.user.id);
//         console.log("File size:", file.size);
  
//       // If storage update fails, delete the uploaded file
//       await supabase.storage
//         .from("uploads")
//         .remove([`user_${req.user.id}/${fileName}`]);
      
//       return res.status(500).json({ 
//         success: false, 
//         error: "Storage update failed"+updateError.message
//       });
//     }

    

// // ✅ Only send ONE response
// return res.json({
//   success: true/false,
//   message: "....",
//   error: "...",
//   url: publicData.publicUrl,
// });

//   } catch (error) {
//     return res.status(500).json({ success: false, error: error.message });
//   }
  
// });


router.post("/upload-file", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ success: false, error: "No file uploaded" });

    // Check storage limit
    const MAX_STORAGE = 5 * 1024 * 1024 * 1024;
    if (req.user.storageUsed + file.size > MAX_STORAGE) {
      return res.status(400).json({ 
        success: false, 
        error: "Storage limit exceeded (5GB max)" 
      });
    }

    const fileName = `${Date.now()}-${file.originalname}`;
    const fileBuffer = file.buffer;

    // Upload to Supabase
    const { data, error: uploadError } = await supabase.storage
      .from("uploads")
      .upload(`user_${req.user.id}/${fileName}`, fileBuffer, { 
        cacheControl: "3600", 
        upsert: false 
      });

    // ✅ PROPER ERROR HANDLING:
    if (uploadError) {
      return res.status(400).json({ success: false, error: uploadError.message });
    }

    // Get public URL (only if upload succeeded)
    const { data: publicData } = supabase.storage
      .from("uploads")
      .getPublicUrl(`user_${req.user.id}/${fileName}`);

    // Update user storage
    try {
      await userModel.findByIdAndUpdate(req.user.id, {
        $inc: { storageUsed: file.size }
      });
    } catch (updateError) {
      // If storage update fails, delete the uploaded file
      await supabase.storage
        .from("uploads")
        .remove([`user_${req.user.id}/${fileName}`]);
      
      return res.status(500).json({ 
        success: false, 
        error: "Storage update failed" 
      });
    }

    // Success response
    return res.json({
      success: true,
      message: "File uploaded successfully!",
      url: publicData.publicUrl
    });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});







// // Show list of uploaded files from Supabase
// router.get("/files", async (req, res) => {
//   try {
//     const { data: files, error } = await supabase.storage
//       .from("uploads")
//       .list("", { limit: 100 }); // root folder of your bucket

//     if (error) return res.status(400).send("Unable to fetch files");

//     // Convert to public URLs
//     const fileUrls = files.map((file) => {
//       const { data } = supabase.storage.from("uploads").getPublicUrl(file.name);
//       return { name: file.name, url: data.publicUrl };

 
//     });

//     res.render("first", 
//       {files: fileUrls,
//       user: { // Add user object
//     name: req.user.name, 
//     email: req.user.email 
//      }
//     });


//   } catch (err) {
//     res.status(500).send(err.message);
//   }
// });




//download
router.post("/download/:filename", async (req, res) => {
  try {
    const { data, error } = await supabase.storage
      .from("uploads")
      .download(`user_${req.user.id}/${req.params.filename}`); // ← ADD USER FOLDER

    if (error) return res.status(400).send("Unable to download file");

    res.setHeader("Content-Disposition", `attachment; filename="${req.params.filename}"`);
    res.send(Buffer.from(await data.arrayBuffer()));
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Delete file - fix the response
router.post("/delete/:filename", async (req, res) => {
  try {
    const fullPath = req.params.filename;
    
    // ✅ STEP 6: First get file metadata to know its size
    const { data: fileInfo, error: infoError } = await supabase.storage
      .from("uploads")
      .list(`user_${req.user.id}/`, {
        search: fullPath
      });
    
    if (infoError || !fileInfo || fileInfo.length === 0) {
      return res.status(400).send("File not found");
    }
    
    const fileSize = fileInfo[0].metadata.size; // Get file size in bytes
    
    // ✅ Delete the file
    const { error } = await supabase.storage
      .from("uploads")
      .remove([`user_${req.user.id}/${fullPath}`]);

    if (error) return res.status(400).send("Unable to delete file");
    
    // ✅ STEP 6: Subtract file size from user's storage usage
    await userModel.findByIdAndUpdate(req.user.id, {
      $inc: { storageUsed: -fileSize } // Subtract file size
    });
    
    res.redirect('/home/get-rows');
  } catch (err) {
    res.status(500).send(err.message);
  }
});


module.exports = router;
