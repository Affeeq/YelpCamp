var mongoose = require("mongoose");
var Campground = require("./models/campground");
var Comment = require("./models/comment");

var data = [
	{
		name: "Cloud's Rest",
	 	image: "https://pixabay.com/get/57e1dd4a4350a514f6da8c7dda793f7f1636dfe2564c704c722b79dc974dc750_340.jpg",
		description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum porttitor tellus sed nunc sollicitudin vehicula. Proin a nisl non nunc egestas eleifend. Donec vulputate nibh quis elit ornare, eget fermentum lorem consequat. Quisque placerat erat at tempor ultrices. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Ut finibus ac nisi non pretium. Duis metus nunc, auctor ut diam a, gravida consequat tortor. Ut rutrum eleifend faucibus. Ut volutpat tincidunt nibh ac viverra. Nam vitae sem nibh."
	},
	{
		name: "Igloo Shed",
	 	image: "https://pixabay.com/get/57e1d14a4e52ae14f6da8c7dda793f7f1636dfe2564c704c722b79dc974dc750_340.jpg",
		description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum porttitor tellus sed nunc sollicitudin vehicula. Proin a nisl non nunc egestas eleifend. Donec vulputate nibh quis elit ornare, eget fermentum lorem consequat. Quisque placerat erat at tempor ultrices. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Ut finibus ac nisi non pretium. Duis metus nunc, auctor ut diam a, gravida consequat tortor. Ut rutrum eleifend faucibus. Ut volutpat tincidunt nibh ac viverra. Nam vitae sem nibh."
	},
	{
		name: "Northern Lights Heaven",
	 	image: "https://pixabay.com/get/52e5d7414355ac14f6da8c7dda793f7f1636dfe2564c704c722b79dc974dc750_340.jpg",
		description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum porttitor tellus sed nunc sollicitudin vehicula. Proin a nisl non nunc egestas eleifend. Donec vulputate nibh quis elit ornare, eget fermentum lorem consequat. Quisque placerat erat at tempor ultrices. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Ut finibus ac nisi non pretium. Duis metus nunc, auctor ut diam a, gravida consequat tortor. Ut rutrum eleifend faucibus. Ut volutpat tincidunt nibh ac viverra. Nam vitae sem nibh."
	}
];

function seedDB() {
	//remove all campgrounds
	Campground.deleteMany({}, function(err) {
		if(err) {
			console.log(err);
		}
		console.log("Remove campgrounds");
		data.forEach(function(seed) {
			Campground.create(seed, function(err, campground) {
				if(err) {
					console.log(err);
				}
				else {
					console.log("Added a campground");
					//create a comment
					Comment.create(
						{
							text: "This place is great but I wish there is Internet",
							author: "Homer"
						}, function(err, comment) {
							if(err) {
								console.log(err);
							}
							campground.comments.push(comment);
							campground.save();
							console.log("Created new comment");
						});
				}
			});
		});
	});
	// add a few campgrounds
	
	
	
	//add a few comments
}

module.exports = seedDB;