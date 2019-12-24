require('dotenv').config();

var express 		= require("express"),
	app 			= express(),
	bodyParser 		= require("body-parser"),
	mongoose 		= require("mongoose"),
	passport 		= require("passport"),
	LocalStrategy	= require("passport-local"),
	methodOverride 	= require("method-override"),
	flash 			= require("connect-flash"),
	moment			= require("moment"),
	cookieParser 	= require("cookie-parser"),
	Campground 		= require("./models/campground"),
	Comment 		= require("./models/comment"),
	User 			= require("./models/user"),
	Notification 	= require("./models/notification"),
	seedDB 			= require("./seeds");

// requiring routes
var campgroundRoutes 	= require("./routes/campgrounds"),
	commentRoutes 		= require("./routes/comments"),
	indexRoutes 		= require("./routes/index");

// app config
mongoose.set('useUnifiedTopology', true);
mongoose.connect("mongodb://localhost:27017/yelp_camp", { useNewUrlParser: true }); // connecting to db collection
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
mongoose.set('useFindAndModify', false); // took out the deprecation warning when updating forms
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(cookieParser("secret"));
app.use(flash());
// seedDB(); // seed the database

//Passport Config
app.use(require("express-session")({
	secret: "Corgis are the best!!!!!",
	resave: false,
	saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// passing through information to all templates/pages
app.use(function(req, res, next) {
	res.locals.currentUser = req.user;
	req.locals.notification = req.notification;
	res.locals.error = req.flash("error");
	res.locals.success = req.flash("success");
	res.locals.moment = moment;
	next();
});

// Route Config
app.use("/" ,indexRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);

app.listen(3000 || process.env.PORT, function() {
	console.log("The YelpCamp server listening on port 3000");
});