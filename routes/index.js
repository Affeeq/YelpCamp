var express = require("express"),
	router = express.Router(),
	passport = require("passport"),
	User = require("../models/user"),
	Campground = require("../models/campground"),
	Notification = require("../models/notification"),
	nodemailer = require("nodemailer"),
	async = require("async"),
	crypto = require("crypto");


// root route

router.get("/", function(req,res) {
	res.render("landing");
});


//===========================================
//Authentication Routes

router.get("/register", function(req,res) {
	res.render("register");
});

//handle sign up logic
router.post("/register", function(req,res) {
	var newUser = new User(
		{
			username: req.body.username, 
			firstName: req.body.firstName,
			lastName: req.body.lastName,
			email: req.body.email,
			avatar: req.body.avatar
		});
	if(req.body.adminCode === process.env.ADMIN_CODE) {
		newUser.isAdmin = true;
	}
	User.register(newUser, req.body.password, function(err, user) {
		if(err) {
			req.flash("error", err.message);
			res.redirect("register");
		}
		passport.authenticate("local")(req, res, function() {
			req.flash("success", "Welcome to YelpCamp " + user.username);
			res.redirect("campgrounds");
		});
	});
});

//  show login form
router.get("/login", function(req,res) {
	res.render("login");
});

// handling login logic
router.post("/login", passport.authenticate("local", 
	{
		successRedirect: "/campgrounds",
		failureRedirect: "/login",
		failureFlash: true,
		successFlash: "Welcome back!"
	}), function(req,res) {
});

// logout route
router.get("/logout", function(req,res) {
	req.logout();
	req.flash("success", "Logged You Out");
	res.redirect("/campgrounds");
});

// password reset
// rendering the forgot password page
router.get("/forgot", function(req,res) {
	res.render("forgot");
});

// submitting user's email and getting the password reset link email
router.post("/forgot", function(req,res,next) {
	async.waterfall([
		// creating a token for user to reset password
		function(done) {
			crypto.randomBytes(20, function(err, buf) {
				var token = buf.toString('hex');
				done(err, token);
			});
		},
		// finding the user associated with the email submmited
		function(token, done) {
			User.findOne({ email: req.body.email }, function(err, user) {
				if(!user) {
					req.flash("error", "No account with that email address");
					return res.redirect("/forgot");
				}
				
				user.resetPasswordToken = token;
				user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
				
				// save updates on user's model
				user.save(function(err) {
					done(err, token, user);
				});
			});
		},
		function(token, user, done) {
			// use nodemailer to send email with reset link and meesage to user's email
			var smtpTransport = nodemailer.createTransport({
				service: "Gmail",
				auth: {
					user: "affeeqabedeenismail@gmail.com",
					pass: process.env.GMAILPW
				}
			});
			var mailOptions = {
				to: user.email,
				from: "affeeqabedeenismail@gmail.com",
				subject: "Node.js Password Reset",
				text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' + 'Please click on the following link, or paste this into your browser to complete the process:\n\n' + 'http://' + req.headers.host + '/reset/' + token + '\n\n' + 'If you did not request this, please ignore this email and your password will remain unchanged.\n'
			};
			smtpTransport.sendMail(mailOptions, function(err) {
				req.flash("success", "An email has been sent to " + user.email + " with further instructions.");
				done(err, "done");
			});
		}
	], function(err) {
		if(err) {
			return next(err);
			res.redirect("/forgot");
		}
	});
});

router.get("/reset/:token", function(req,res) {
	User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
		if(!user) {
			req.flash("error", "Password reset token is invalid or has expired");
			return res.redirect("/forgot");
		}
		res.render("reset", {token: req.params.token});
	});
});

router.post("/reset/:token", function(req,res) {
	async.waterfall([
		// reset password handling
		function(done) {
			// find user with matching token and before token expiry time
			User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
				if(!user) {
				  req.flash('error', 'Password reset token is invalid or has expired.');
				  return res.redirect('back');
				}
				// checking if user input the right password in both inputs
				if(req.body.password === req.body.confirm) {
					// set the password input into the user's password database
					user.setPassword(req.body.password, function(err) {
						// clear the user's resetPasswordToken and resetPasswordExpires value
						user.resetPasswordToken = undefined;
						user.resetPasswordExpires = undefined;
						
						// save information for user on database
						user.save(function(err) {
							// log user in into the app
							req.logIn(user, function(err) {
								// finishing up the function to go to the next function
								done(err, user);
							});
						});
					});
				}
				else {
					req.flash("error", 'Passwords do not match');
					return res.redirect('back');
				}
			});
		},
		// sending a success reset password email to user
		function(user, done) {
			// verifying app's email service account
			var smtpTransport = nodemailer.createTransport({
				service: "Gmail",
				auth: {
					user: "affeeqabedeenismail@gmail.com",
					pass: process.env.GMAILPW
				}
			});
			// creating the email for the app's email service account to user's email
			var mailOptions = {
				to: user.email,
				from: "affeeqabedeenismail@gmail.com",
				subject: "Your password has changed",
				text: "Hello, \n\n" + "This is a confirmation that the password for your account " + user.email + " has just been changed.\n"
			};
			// sending email to user
			smtpTransport.sendMail(mailOptions, function(err) {
				// giving the success message and finish up the function with done
				req.flash("success", "Your password has been changed.");
				done(err);
			});
		}
	], function(err) {
		// after finishing up all functions, redirect user to cammpgrounds
		res.redirect("/campgrounds");
	});
});

// user profile route
router.get("/users/:id", function(req,res) {
	User.findById(req.params.id, function(err, foundUser) {
		if(err) {
			req.flash("error", "No user found");
			res.redirect("/");
		}
		Campground.find().where("author.id").equals(foundUser._id).exec(function(err, campgrounds) {
			if(err) {
				req.flash("error", "No user found");
				res.redirect("/");
			}
			res.render("users/show", {user: foundUser, campgrounds: campgrounds});
		})
	});
});

//view all notifications
router.get("/notifications", function(req,res) {
	res.render("notification");
});

module.exports = router;