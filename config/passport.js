// load all the things we need
var FacebookStrategy = require('passport-facebook').Strategy;
var User = require('../models/user');
var configAuth = require('./auth');

module.exports = function (passport) {
    // used to serialize the user for the session
    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function (id, done) {
        User.findById(id, function (err, user) {
            done(err, user);
        });
    });

    // =========================================================================
    // FACEBOOK ================================================================
    // =========================================================================
    passport.use(new FacebookStrategy({
        // pull in our app id and secret from our auth.js file
        clientID: configAuth.facebookAuth.clientID,
        clientSecret: configAuth.facebookAuth.clientSecret,
        callbackURL: configAuth.facebookAuth.callbackURL,
        profileFields: ['emails', 'name', 'displayName']
    },
        // facebook will send back the token and profile
        function (token, refreshToken, profile, done) {

            //console.log('profile ', profile);

            // asynchronous
            process.nextTick(function () {
                // find the user in the database based on their facebook id
                User.findOne({ 'fb.id': profile.id }, function (err, user) {
                    // if there is an error, stop everything and return that
                    // ie an error connecting to the database
                    if (err)
                        return done(err);

                    // if the user is found, then log them in
                    if (user) {
                        console.log('user found');
                        return done(null, user); // user found, return that user
                    } else {
                        console.log('cannot find user, insert new');
                        // if there is no user found with that facebook id, create them
                        var newUser = new User();

                        // set all of the facebook information in our user model
                        newUser.fb.id = profile.id; // set the users facebook id	                
                        newUser.fb.access_token = token; // we will save the token that facebook provides to the user	                
                        newUser.fb.name = profile.displayName;                                            
                        newUser.fb.email = profile.emails[0].value; // facebook can return multiple emails so we'll take the first

                        // save our user to the database
                        newUser.save(function (err) {
                            if (err)
                                throw err;

                            // if successful, return the new user
                            return done(null, newUser);
                        });
                    }
                });
            });
        }));
};