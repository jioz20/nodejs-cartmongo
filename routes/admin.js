const router = require("express").Router();
const AdminController = require("../controllers/admin");
const isAuth = require("../middleware/is-auth");
const {body} = require("express-validator/check");

router.get("/addproduct", isAuth, AdminController.getAddProduct);

router.post("/addproduct", [
    body('title')
        .isString()
        .isLength({min: 3})
        .trim(),
    body('price')
        .isFloat(),
    body('description')
        .isString()
        .isLength({min: 5, max: 400})
        .trim()
], isAuth, AdminController.postAddProduct);

router.get("/products", isAuth, AdminController.ListProductsAdmin);

router.get("/editproduct/:id", [
    body('title')
        .isString()
        .isLength({min: 3})
        .trim(),
    body('price')
        .isFloat(),
    body('description')
        .isString()
        .isLength({min: 5, max: 400})
        .trim()
], isAuth, AdminController.EditProduct);

router.post("/editproduct", [
    body('title')
        .isString()
        .isLength({min: 3})
        .trim(),
    body('price')
        .isFloat(),
    body('description')
        .isString()
        .isLength({min: 5, max: 400})
        .trim()
], isAuth, AdminController.PostEditProduct);

router.delete("/deleteproduct/:id", isAuth, AdminController.DeleteProduct);


module.exports = router;