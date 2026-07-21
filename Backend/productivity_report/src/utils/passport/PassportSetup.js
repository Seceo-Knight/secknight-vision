const passport = require('passport');
const AtlassianStrategy = require('passport-atlassian-oauth2');

// passport.serializeUser((user, done) => done(null, user));
// passport.deserializeUser((obj, done) => done(null, obj));

// Stuff user info in cookie
passport.serializeUser((user, done) => done(null, user));

// Get User Info From Cookie
passport.deserializeUser((obj, done) =>
    User.findById(obj.id).then((user) => {
        done(null, user); // Attach User Property to req object and can be accessed in route handler
    })
);

passport.use(new AtlassianStrategy({
    clientID: process.env.ATLASSIAN_CLIENT_ID,
    clientSecret: process.env.ATLASSIAN_CLIENT_SECRET,
    callbackURL: 'https://35a957de.ngrok.io/auth/atlassian/callback',
    scope: 'offline_access read:jira-user read:jira-work',
},
    (accessToken, refreshToken, profile, done) => {
        done(null, profile);
    }
));
