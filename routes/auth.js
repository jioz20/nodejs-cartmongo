const express = require("express");
const {check, body} = require("express-validator/check");
const router = express.Router();
const authController = require("../controllers/auth");
const User = require("../model/user");


router.get("/login", authController.getLogin);
router.post("/login", [
        body('email')
            .isEmail()
            .withMessage('Please enter valid email address')
            .normalizeEmail(),
        body('password', 'Password has to be valid')
            .isLength({min: 6})
            .isAlphanumeric()
            .trim()

], authController.postLogin);


router.post("/logout", authController.postLogout);


router.get("/signup", authController.getSignup);
router.post("/signup", [
        check('email')
                .isEmail()
                .withMessage('Please enter a valid email')
                .custom((value, {req})=>
                {
                    return User.findOne({email: value})
                    .then(userExits => {
                            //Check email ton tai
                            if(userExits)
                                return Promise.reject('E-Mail Exits already, please pick a different one');
                            })
                })
                .normalizeEmail(),

        body('password', "Please enter a minimum of 6 characters!")
                .isLength({min: 6})
                .isAlphanumeric()
                .trim(),

        body('confirmpassword')
                .trim()
                .custom((value, {req})=>{
                    if(value !== req.body.password)
                        throw new Error("Password have to match!");
                    return true;
                })

    ]
    ,authController.postSignup);


router.get("/reset", authController.getReset);
router.post("/reset", authController.postReset);
router.get("/reset/:token", authController.getNewPassword);


router.post("/new-password", authController.postNewPassword);
module.exports = router;