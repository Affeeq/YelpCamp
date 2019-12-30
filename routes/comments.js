var express = require("express"),
	router = express.Router({mergeParams: true}),
	Campground = require("../models/campground"),
	Comment = require("../models/comment"),
	User = require("../models/user"),
	Notification = require("../models/notification"),
	middleware = require("../middleware");

// comments new

router.get("/new", middleware.isLoggedIn, function(req,res) {
	//find campground by ID
	Campground.findById(req.params.id, function(err, campground) {
		if(err) {
			console.log(err);
		}
		else {
			res.render("comments/new", {campground: campground});
		}
	});
});

// comments create
router.post("/", middleware.isLoggedIn, function(req,res) {
	//look up campground using ID
	Campground.findById(req.params.id, function(err, campground) {
		if(err) {
			console.log(err);
			res.redirect("/campgrounds");
		}
		else {
			//create new comment
			Comment.create(req.body.comment, function(err, comment) {
				if(err) {
					req.flash("error", "Something went wrong");
					console.log(err);
				}
				else {
					//add username and id to comment
					comment.author.id = req.user._id;
					comment.author.username = req.user.username;
					//save comment
					comment.save();
					//connect new comment to campground
					campground.comments.push(comment);
					campground.save();
					//create new notification in db 
					var newNotification = {
						username: req.user.username,
						authorId: req.user._id,
						campgroundId: campground._id
					}
					Notification.create(newNotification, function(err, createdNotification) {
						if(err) {
							req.flash("error", err.message);
							return res.redirect("back");
						}
						else {
							User.findById(createdNotification.authorId, function(err, user) {
								if(err) {
									console.log(err)
								}
								else {
									user.notifications.push(createdNotification);
									user.save();
									req.flash("success", "Successfully added comment");
									//redirect to campground show page
									res.redirect("/campgrounds/" + campground._id);
								}
							});
						}
					});
				}
			});
		}
	});
});

//edit route
router.get("/:comment_id/edit", middleware.checkCommentOwnership, function(req, res) {
	Comment.findById(req.params.comment_id, function(err, foundComment) {
		if(err) {
			res.redirect("back");
		}
		else {
			res.render("comments/edit", {campground_id: req.params.id, comment: foundComment});
		}
	});
});

//update route
router.put("/:comment_id", middleware.checkCommentOwnership, function(req,res) {
	Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment) {
		if(err) {
			res.redirect("back");
		}
		else {
			req.flash("success", "Comment Updated")
			res.redirect("/campgrounds/" + req.params.id);
		}
	});
});

// delete route
router.delete("/:comment_id", middleware.checkCommentOwnership, function(req,res) {
	//find by id and remove
	Comment.findByIdAndRemove(req.params.comment_id, function(err,) {
		if(err) {
			res.redirect("back");
		}
		else {
			req.flash("succcess", "Comment deleted");
			res.redirect("/campgrounds/" + req.params.id);
		}
	});
});

module.exports = router;