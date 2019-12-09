var express = require("express"),
	router = express.Router(),
	Campground = require("../models/campground"),
	Comment = require("..//models/comment"),
	middleware = require("../middleware");
	
//INDEX - show all campgrounds
router.get("/", function(req,res) {
	// Get all campgrounds from db
	Campground.find({}, function(err,allCampgrounds) {
		if(err) {
			console.log(err);
		}
		else {
			res.render("campgrounds/index" , {campgrounds: allCampgrounds});
		}
	});
});

//CREATE - add new campground to db
router.post("/", middleware.isLoggedIn, function(req,res) {
	var name = req.body.name;
	var price = req.body.price;
	var image = req.body.image;
	var description = req.body.description;
	var author = {
		id: req.user._id,
		username: req.user.username
	};
	var newCampground = {name: name, price: price, image: image, description: description, author: author};
	// create a new campground and save to database
	Campground.create(newCampground, function(err,newlyCreated) {
		if(err) {
			console.log(err);
		}
		else {
			//redirect back to campgrounds page
			res.redirect("/campgrounds");
		}
	})
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
			console.log(foundCampground);
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
router.put("/:id", middleware.checkCampgroundOwnership, function(req,res) {
	// find and update the correct campground
	Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err,updatedCampground) {
		if(err) {
			res.redirect("/campgrounds");
		}
		else {
			res.redirect("/campgrounds/" + req.params.id);
		}
	});
});

//DELETE route
router.delete("/:id", middleware.checkCampgroundOwnership, function(req,res) {
	Campground.findByIdAndRemove(req.params.id, function(err) {
		if(err) {
			res.redirect("/campgrounds");
		}
		else {
			res.redirect("/campgrounds");
		}
	});
});

module.exports = router;