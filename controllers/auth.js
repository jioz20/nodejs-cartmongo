const crypto = require("crypto");

const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const sendgirdTransport = require("nodemailer-sendgrid-transport");
const { validationResult} = require("express-validator/check");

const User = require("../model/user");

const transporter = nodemailer.createTransport(sendgirdTransport({
    auth: {
        api_key: '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'
    }
}));

//Login
exports.getLogin = (req, res, next) => {
    
    // console.log(req.session.isLoggedIn);
    res.render("auth/login", {
        path: '/login',
        error_message: '',
        oldInput: {
            email: '',
            password: ''
        },
        validationErrors: []
    })
}

exports.postLogin = (req,res, next) => {
    const {email, password} = req.body;
    const errors = validationResult(req);

    if(!errors.isEmpty())
    {
        return res.status(422).render("auth/login", {
            path: '/login',
            error_message: errors.array()[0].msg,
            oldInput: { 
                email: email,
                password: password
            },
            validationErrors: errors.array()
        });
    }

    User.findOne({email: email})
    .then(user => {

        if(!user)
        {
            return res.status(422).render("auth/login", {
                path: '/login',
                error_message: "Account has not been initialized!",
                oldInput: {
                    email: email,
                    password: password
                },
                validationErrors: []
            });
        }        
        //so khop pass
        bcrypt.compare(password, user.password)
              .then(doMatch => {
                if(doMatch)
                {
                    req.session.isLoggedIn = true;
                    req.session.user = user;
                    return req.session.save(err => {
                        if(err)
                            console.log(err);
                        res.redirect("/");
                    });           
                }
                else
                {
                    return res.status(422).render("auth/login", {
                        path: '/login',
                        error_message: "Email or password incorrect!",
                        oldInput: {
                            email: email,
                            password: password
                        },
                        validationErrors: []
                     }); 
                }
                r
              })
              .catch(err => {
                const error = new Error(err);
                error.httpStatusCode = 500;
                return next(error);
            });
       
        
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}

//Logout
exports.postLogout = (req,res, next) => {
    req.session.destroy((err)=>{
        if(err)
            console.log(err)
        res.redirect("/");
    })
}


//Register

exports.getSignup = (req, res, next) => {
    
    // console.log(req.session.isLoggedIn);
    res.render("auth/signup", {
        path: '/signup',
        error_message: '',
        oldInput: 
        {
            name: '',
            email: ''
        },
        validationErrors: []
    })
}

exports.postSignup = (req,res, next) => {
    const {name, email, password} = req.body;
    const errors = validationResult(req);

    if(!errors.isEmpty())
    {
        // console.log(errors.array()); 
        return res.status(422).render("auth/signup", {
                                path: '/signup',
                                error_message: errors.array()[0].msg,
                                oldInput: 
                                {
                                    name: name,
                                    email: email
                                },
                                validationErrors: errors.array()
                            })
    }

        //Ma hoa 12 vong
         bcrypt.hash(password, 12)
            .then(hashPassword => { 
                const user = new User({
                    name: name,       
                    password: hashPassword,
                    email: email,
                    cart: {items: []}
                })
                return user.save();
            })
            .then(result => {
                res.redirect("/login");
                //Gui mail toi nguoi dang ky
                return transporter.sendMail({
                    to: email,
                    from: 'shop@note-testcomplete.com',
                    subject: 'Signup succeeded',
                    html: '<h1>You successfully signed up!</h1>'
                })
                
            })
            .catch(err => {
                const error = new Error(err);
                error.httpStatusCode = 500;
                return next(error);
            });

   
}

//Reset password

exports.getReset = (req, res, next) => { 
    res.render("auth/reset", {
        path: '/reset'
    })
}

exports.postReset = (req, res, next) => {
    crypto.randomBytes(32, (err, buffer)=>{
        if(err)
        {
            console.log(err)
            return res.redirect("/reset");
        }
        const token = buffer.toString('hex');
        User.findOne({email: req.body.email})
            .then(user => {
                if(!user)
                {
                    req.flash('error_message', 'No account with that email found');
                    return res.redirect("/reset");
                }
                user.resetToken = token;
                user.resetTokenExpiration = Date.now() + 3600000;
                return user.save();
            })
            .then(result => {
                res.redirect("/");
                transporter.sendMail({
                    to: req.body.email,
                    from: 'shop@note-testcomplete.com',
                    subject: 'Password Reset',
                    html: 
                    `
                        <p>You requested a password reset</p>
                        <p>Click this <a href="http://localhost:3000/reset/${token}">Link to set a new password</a></p>
                    `
                })
            })
            .catch(err => {
                const error = new Error(err);
                error.httpStatusCode = 500;
                return next(error);
            });
    })
}


exports.getNewPassword = (req, res, next) => {
    const token = req.params.token;
    User.findOne({resetToken: token, resetTokenExpiration: {$gt: Date.now()}})
        .then(user => {

            res.render("auth/new-password", {
                path: '/new-password',
                userId: user._id.toString(),
                passwordToken: token
            })
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}

exports.postNewPassword = (req, res, next) => {
    const newPassword = req.body.password;
    const userId = req.body.userId;
    const passwordToken = req.body.passwordToken;
    let resetUser;

    User.findOne({resetToken: passwordToken, resetTokenExpiration: {$gt: Date.now()}, _id: userId})
        .then(user => {
            resetUser = user;
            return bcrypt.hash(newPassword, 12)
        })
        .then(hashedPassword => {
            resetUser.password = hashedPassword;
            resetUser.resetToken = undefined;
            resetUser.resetTokenExpiration = undefined;
            return resetUser.save();
        })
        .then(result => { 
            res.redirect("/login");  
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });

}
