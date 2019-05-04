const router = require("express").Router();
const shopController = require("../controllers/shop");
const isAuth = require("../middleware/is-auth");


router.get("/", shopController.getIndex);

router.get("/product-list", shopController.getProducts);

router.get("/product-detail/:id", shopController.getProduct);

router.get("/cart", isAuth, shopController.getCart);

router.post("/postcard", isAuth, shopController.PostCart);

router.get("/getCartDeleteProduct/:id", isAuth, shopController.getCartDeleteProduct)

//checkout 
router.get("/checkout", isAuth, shopController.getCheckout);




router.get("/orders", isAuth, shopController.getOrders);

router.get('/orders/:id', isAuth, shopController.getInvoice);

module.exports = router;