const express = require("express");
const bodyParser = require("body-parser");
const shopRoutes = require("./routes/shop");
const adminRoutes = require("./routes/admin");
const authRoutes = require("./routes/auth");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session); //Thu vien nay de lay session luu xuong database
const MONGODB_URI = 'mongodb://module2:nguyentri1998@ds031952.mlab.com:31952/module2';
const mongoose = require("mongoose");
const errorController = require("./controllers/error");
const User = require("./model/user");
const csrf = require("csurf"); //Token csrf
const flash = require("connect-flash");
const multer = require("multer");
const shopController = require("./controllers/shop");
const isAuth = require("./middleware/is-auth");

const app = express();

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/images')
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() +'-' + file.originalname);
    }
})

//So sanh kieu de uploads
let arrFileFilter = ['image/png', 'image/jpg', 'image/jpeg'];

const fileFilter = (req, file, cb) => {
    if(arrFileFilter.includes(file.mimetype))
        cb(null, true);
    else
        cb(null, false);
}



    

const store = new MongoDBStore({
    uri: MONGODB_URI,
    collection: 'sessions'
});

const csrfProtection = csrf();

app.set("views", "./views");
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: false}));
app.use(multer({storage: fileStorage, fileFilter: fileFilter}).single('imageUrl'))

app.use(session({
    secret: 'my secret', 
    resave: true,
    saveUninitialized: true,
    store: store
}))


app.use(flash());

//Su dung user de hoat dong toan trang web
app.use((req, res, next)=>{
    if(req.session.user)
    {
        User.findById(req.session.user._id)
        .then(user => {
            if(!user)
                return next();
            req.user = user
            next();
            
        })
        .catch(err => {
            throw new Error(err);
                return res.redirect("/login");
        })
    }
    else
    {
        return next();
    }
})

app.use((req, res, next)=>{
    res.locals.isAuthenticated = req.session.isLoggedIn;
    next();
})

// app.use(function (req, res, next) {
//     res.locals.error_message = req.flash('error_message');
//     next();
// })

// pay
app.post("/create-order", isAuth, shopController.postOrder);

app.use(csrfProtection);

app.use((req, res, next)=>{
    res.locals.csrfToken = req.csrfToken();
    next();
})

app.use(shopRoutes);
app.use(authRoutes);
app.use("/admin", adminRoutes);






// app.use((error, req, res, next)=>{
//     res.status(500).redirect('/500');
// })  

// app.use('/500', errorController.Get500);
app.use(errorController.Get404);


mongoose.connect(MONGODB_URI,  {useNewUrlParser: true})
.then(result=>{
    app.listen(process.env.PORT || 3000);
})
.catch(err => console.log(err));
