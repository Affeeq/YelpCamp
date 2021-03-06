var express = require("express"),
	router = express.Router(),
	Campground = require("../models/campground"),
	Comment = require("..//models/comment"),
	middleware = require("../middleware"),
	NodeGeocoder = require('node-geocoder'),
	multer = require('multer');

// image upload
//=====Multer Config============
// create a name with date and original file name for the image uploaded 
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});

// filter file to make sure file uploaded is an image file
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

// pass in key value pairs for uploaded image to work
var upload = multer({ storage: storage, fileFilter: imageFilter})

//=====Cloudinary Config============
var cloudinary = require('cloudinary').v2;
cloudinary.config({ 
  cloud_name: 'imgstorageismail', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});
 

//=====Georcoder Config============
var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
 
var geocoder = NodeGeocoder(options);
	
//INDEX - show all campgrounds
router.get("/", function(req,res) {
	if(req.query.search) {
       const regex = new RegExp(escapeRegex(req.query.search), 'gi');
		// Get all campgrounds from db
		Campground.find({name: regex}, function(err,allCampgrounds) {
			if(err) {
				console.log(err);
			}
			else {
				if(allCampgrounds.length < 1) {
					req.flash('error', 'No matches found');
      				return res.redirect('back');
				} else {
					res.render("campgrounds/index" , {campgrounds: allCampgrounds});
				}
			}
		});
	}
	else {
		// Get all campgrounds from db
		Campground.find({}, function(err,allCampgrounds) {
			if(err) {
				console.log(err);
			}
			else {
				res.render("campgrounds/index" , {campgrounds: allCampgrounds});
			}
		});
	}
});

//CREATE - add new campground to DB
router.post("/", middleware.isLoggedIn, upload.single("image"), function(req, res){
	// handling campground api address
	geocoder.geocode(req.body.location, function (err, data) {
		if (err || !data.length) {
			req.flash('error', 'Invalid address');
			return res.redirect('back');
		}
		req.body.campground.lat = data[0].latitude;
		req.body.campground.lng = data[0].longitude;
		req.body.campground.location = data[0].formattedAddress;
		// handling image upload
		cloudinary.uploader.upload(req.file.path, function(err, result) {
			if(err) {
				req.flash("error", err.message);
				return res.redirect("back");
			}
			// add cloudinary url for the image to the campground object under image property
			req.body.campground.image = result.secure_url;
			// add image's public_id to campground object
			req.body.campground.imageId = result.public_id;
			// add author to campground
			req.body.campground.author = {
				id: req.user._id,
				username: req.user.username
			 }
			// Create a new campground and save to DB
			Campground.create(req.body.campground, function(err, newCampground){
				if(err){
					req.flash("error", err.message);
					return res.redirect("back");
				}
				//redirect back to campgrounds show page
				res.redirect("/campgrounds/" + newCampground.id);
			});
		});
	});
});

//NEW - show form to create new campground
router.get("/new", middleware.isLoggedIn, function(req,res) {
	res.render("campgrounds/new");
});


//SHOW - more info about one campground
router.get("/:id", function(req,res) {
	//find the campground with provided id
	Campground.findById(req.params.id).populate("comments").exec(function(err,foundCampground) {
		if(err) {
			console.log(err);
		}
		else {
			//render show template with that campground
			res.render("campgrounds/show", {campground: foundCampground});
		}
	});
});

// EDIT campground route
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req,res) {
	Campground.findById(req.params.id, function(err, foundCampground) {
		res.render("campgrounds/edit", {campground: foundCampground});
	});
});

// UPDATE campground route
router.put("/:id", middleware.checkCampgroundOwnership, upload.single("image"), function(req, res){
	// handle campground api address update
  	geocoder.geocode(req.body.location, function (err, data) {
		if (err || !data.length) {
		  req.flash('error', 'Invalid address');
		  return res.redirect('back');
		}
		req.body.campground.lat = data[0].latitude;
		req.body.campground.lng = data[0].longitude;
		req.body.campground.location = data[0].formattedAddress;

		Campground.findByIdAndUpdate(req.params.id, req.body.campground, async function(err, campground){
			if(err){
				req.flash("error", err.message);
				return res.redirect("back");
			} else {
				if(req.file) {
					try {
						// handle image upload update
						// check if a new image is uploaded
						await cloudinary.uploader.destroy(campground.imageId);
						var result = await cloudinary.uploader.upload(req.file.path);
						campground.imageId = result.public_id;
						campground.image = result.secure_url;
					} catch(err) {
						req.flash("error", err.message);
						return res.redirect("back");
					}
				}
				campground.save();
				req.flash("success","Successfully Updated!");
				res.redirect("/campgrounds/" + campground._id);
			}
    	});
  	});
});

//DELETE route
router.delete("/:id", middleware.checkCampgroundOwnership, function(req,res) {
	Campground.findByIdAndRemove(req.params.id, async function(err, campground) {
		if(err) {
			req.flash("error", err.message);
			return res.redirect("back");
		}
		try {
			await cloudinary.uploader.destroy(campground.imageId);
			await Comment.deleteMany(
				{_id: 
				 	{ $in: campground.comments}
				}
			);
			req.flash("success", "Successfully deleted post")
			res.redirect("/campgrounds");
		} catch(err) {
			req.flash("error", err.message);
			return res.redirect("/campgrounds");
		}	
	});
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;