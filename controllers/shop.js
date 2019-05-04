const Product = require("../model/product");
const Order = require("../model/order");
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
var stripe = require("stripe")("sk_test_s9OxowmnwhcWL99VaW2Ke03G00twgI19X3");

//So san pham tren 1 trang
const ITEMS_ON_PAGE = 3;


exports.getProducts = (req, res, next)=>{

    const page = + req.query.page || 1;
    let TOTAL_PAGE = 0;
    let countProduct = 0;
    // console.log(page);
    Product.find()
    .countDocuments()
    .then(numProduct => {
         //So trang = so luong san pham / so tin tren trang;  
         countProduct = numProduct;
        TOTAL_PAGE = numProduct / ITEMS_ON_PAGE;

        // console.log(TOTAL_PAGE);
        // console.log(numProduct);

        return  Product.find()
                        .skip((page - 1)* ITEMS_ON_PAGE) //Lay tu tri nao
                        .limit(ITEMS_ON_PAGE)            //Gioi han la bao nhieu san pham
       
    })
    .then(products => {
        res.render("shop/product-list", {
            prods: products,
            path: '/products',
            totalPage: Math.ceil(TOTAL_PAGE),
            hasNextPage : ITEMS_ON_PAGE * page < countProduct, //sản phẩm trên trang * số trang phải bé hơn tổng số trang                                                       
            hasPreviousPage : page > 1, //dieu kien page > 1 mới được lùi page
            nextPage: page + 1,
            previousPage : page - 1,
            lastPage : Math.ceil(countProduct / ITEMS_ON_PAGE), // làm tròn lên 1 page
            activePage: page
        })
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}


// //Lay 1 san pham
exports.getProduct = (req, res, next)=>
{
  Product.findById(req.params.id)
  .then(product => {
      res.render("shop/product-detail", {
          product: product,
          path: "/products"
      })
  })
  .catch(err => {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
});
}


exports.getIndex = (req, res, next) =>{
    const page = + req.query.page || 1;
    let TOTAL_PAGE = 0;
    let countProduct = 0;

    
    
    Product.find()
    .countDocuments()
    .then(numProduct => {
         //So trang = so luong san pham / so tin tren trang;  
         countProduct = numProduct;
        TOTAL_PAGE = numProduct / ITEMS_ON_PAGE;


        // console.log(numProduct);
        return  Product.find()
                        .skip((page - 1)* ITEMS_ON_PAGE) //Lay tu tri nao
                        .limit(ITEMS_ON_PAGE)            //Gioi han la bao nhieu san pham
       
    })
    .then(products => {
        res.render("shop/index", {
            prods: products,
            path: '/',
            totalPage:  Math.ceil(TOTAL_PAGE),
            hasNextPage : ITEMS_ON_PAGE * page < countProduct, //sản phẩm trên trang * số trang phải bé hơn tổng số trang                                                       
            hasPreviousPage : page > 1, //dieu kien page > 1 mới được lùi page
            nextPage: page + 1,
            previousPage : page - 1,
            lastPage : Math.ceil(countProduct / ITEMS_ON_PAGE), // làm tròn lên 1 page
            activePage: page
        })
        
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}




//Get Card
exports.getCart = (req, res, next) => {
    req.user.populate('cart.items.productId')
    .execPopulate()
    .then(user => {
        // console.log(user.cart.items);
        const products = user.cart.items;
        res.render("shop/cart", {
            path: '/cart',
            products: products
        })
    })
}


// //Post Card
exports.PostCart = (req, res, next) => {
    Product.findById(req.body.id)
    .then(product => {
        return req.user.addToCart(product);
    })
    .then(result => {
        // console.log(result)
        res.redirect("/cart");
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}

// //Delete Card
exports.getCartDeleteProduct = (req, res, next) => 
{
    const productId = req.params.id;
    req.user
    .removeFromCart(productId)
    .then(result => {
        return res.redirect('/cart');
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}

exports.getCheckout = (req, res, next) => {
    req.user.populate('cart.items.productId')
    .execPopulate()
    .then(user => {
        // console.log(user.cart.items);
        const products = user.cart.items;
        let totalPrice = 0;

        products.forEach(data => {
            totalPrice += data.quantity * data.productId.price;
        })
        res.render("shop/checkout", {
            path: '/checkout',
            products: products,
            totalPrice: totalPrice
        })
    })
}




// //Orders
// ... có nghĩa là lấy nhiều
exports.postOrder = (req, res, next) => {
    console.log("aaaaaaaaaaa");
    let totalSum = 0;
    req.user.populate('cart.items.productId')
    .execPopulate()
    .then(user => {

        user.cart.items.forEach(p => {
            totalSum += p.quantity * p.productId.price;
        })

        const products = user.cart.items.map(i => {
            return {quantity: i.quantity, product: {...i.productId._doc}};
        })
        const order = new Order({
            user: {
                email : req.user.email,
                userId: req.user
            },
            products: products
        });
        return order.save();
    })
    .then(result => {
        const token = req.body.stripeToken;
        const charge = stripe.charges.create({
            amount: totalSum * 100,
            currency: 'usd',
            description: 'Yours orders',
            source: token
          });
          
        req.user.clearCart(); 
    })
    .then(()=>{
        return res.redirect("/orders");
    })
    .catch(err => {
        const error = new Error(err);
        return next(error);
    });
}


exports.getOrders = (req, res, next) => {
    Order.find({"user.userId": req.user._id})
    .then(orders =>{
        // console.log(orders);
        res.render("shop/orders", {
            path: '/orders',
            orders: orders
        })
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}

exports.getInvoice = (req, res, next) => {
    const doc = new PDFDocument();
    const {id} = req.params;
    const invoiceName = 'invoice-' + id + '.pdf';
    Order.findById(id)
    .then(order => {
        if(!order)
            return nexT(new Error('Order not found'));
        
            // console.log(order);
        if(order.user.userId.toString() !== req.user._id.toString())
            return next(new Error('Unauthorized'))

        const invoicePath = path.join('data', 'invoices', invoiceName);
        // fs.readFile(invoicePath, (err, data)=>{
        //     if(err)
        //         return next(err);
        //     res.setHeader('Content-Type', 'application/pdf');
        //     res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"');
        //     res.send(data);
        // });


        doc.pipe(fs.createWriteStream(invoicePath))
        doc.pipe(res);
        doc.fontSize(30).text("Invoice", {
            underline: true
        });
        doc.text("--------------------------------");
        let totalPrice = 0;
        order.products.forEach(prods => {
            

            totalPrice += prods.product.price * prods.quantity;
            doc.fontSize(14).text(prods.product.title + ' - ' + 
                        ' Quantity: ' + prods.quantity + ' - ' + 
                        ' Price: ' + prods.product.price + '$');

         

        })
        doc.text("------------------");
        doc.fontSize(14).text('Total: ' + totalPrice + '$');
        doc.end();

        
    })
    .catch(err => next(err))

    //Ghep duong dan
    

}