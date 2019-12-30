var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var notificationSchema = new mongoose.Schema({
	username: String,
	authorId: String,
	campgroundId: String,
	isRead: { type: Boolean, default: false}
});

notificationSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("Notification", notificationSchema);