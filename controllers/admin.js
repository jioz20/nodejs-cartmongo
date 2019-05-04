const {validationResult} = require("express-validator/check");
const Product = require("../model/product");
const fileHelper = require("../util/file");

//Them san pham
exports.getAddProduct = (req, res, next)=>{
    res.render("admin/addProduct", {
        path: '/admin/addproduct',
        hasError: false,
        editing: false,
        error_message: null,
        validationErrors: [], 
        oldInput: {
            title: '',
            price: '',
            imageUrl: '',
            description: ''
        }
    })
}

exports.postAddProduct = (req, res, next)=>{
    const {title, price, description} = req.body;
    const errors = validationResult(req);
    if(!req.file)
    {
        return res.status(422).render("admin/addProduct", {
            path: '/admin/addproduct',
            editing: false,
            hasError: true, 
            validationErrors: [],
            error_message: 'Attached file is not an image',
            oldInput: {
                title: title,
                price: price,
                description: description
            }
        }) 
    }

    // console.log(req.file);
    if(!errors.isEmpty())
    {
        // console.log(errors.array());
        return res.status(422).render("admin/addProduct", {
            path: '/admin/addproduct',
            editing: false,
            hasError: true,
            validationErrors: errors.array(),
            error_message: errors.array()[0].msg,
            oldInput: {
                title: title,
                price: price,
                description: description
            }
        }) 
    }



    const product = new Product({
        title: title,
        price : price,
        description: description,
        imageUrl: req.file.filename,
        userId: req.user
    });

    product.save()
    .then(result => {
        res.redirect("/admin/products");
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}


//List
exports.ListProductsAdmin = (req, res, next) => {
    Product.find({userId: req.user._id})
    // .select('title price -_id') //Hien thi nhung gia tri can lay
    // .populate('userId', 'name') //Lồng dữ liệu vào theo điều kiện nào đó vd: ID
    .then(products => {
        // console.log(products)
        res.render("admin/products", {
            prods: products,
            path: '/admin/products'
        })
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}


//Update
exports.EditProduct = (req, res, next)=>{
    const {id} = req.params; 

    Product.findById(id)
    .then(product => {
        if(!product)
            return res.redirect("/")
        res.render("admin/editProduct", { 
            path: "/admin/edit-product",
            hasError: false,
            editing: true,
            product: product,
            error_message: null,
            validationErrors: []     
        })
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}

exports.PostEditProduct = (req, res, next)=>{
    const {id, title, price, description} = req.body;
    const errors = validationResult(req);

    if(!errors.isEmpty())
    {
        // console.log(errors.array());
        return res.status(422).render("admin/editProduct", {
            path: '/admin/edit-product',
            editing: true,
            hasError: true,
            product: 
            {
                id: id,
                title: title,
                price: price,
                description: description                
            },
            validationErrors: errors.array(),
            error_message: errors.array()[0].msg
        }) 
    }

    Product.findById(id)
    .then(product => {
        if(product.userId.toString() !== req.user._id.toString())
        {
            return res.redirect("/");
        }
        product.title = title;
        if(req.file)
        {
            fileHelper.deleteFile(product.imageUrl);
            product.imageUrl = req.file.filename;
        }
        
        product.price = price;
        product.description = description;
        return product.save()
                      .then(result => {
                            return res.redirect("/admin/products");
                        })
    })
    
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}

//protection: su bao ve

//delete
exports.DeleteProduct = (req, res, next)=>{

    const id = req.params.id;
    Product.findById(id)
    .then(product => { 
        if(!product)
            return next(new Error ('Product not found'));
        fileHelper.deleteFile(product.imageUrl);
        return Product.findByIdAndDelete(id)    
    })
    .then(()=>{
        res.status(200).json({error_message: 'Success!'});
    })
    .catch(err => {
        res.status(500).json({error_message: 'Deleting product failed!'});
    });
}