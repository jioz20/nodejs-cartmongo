const fs = require("fs");
const deleteFile = (filePath) => {
    fs.unlink( './public/images/' + filePath, (err)=>{
        if(err)
            throw (err);
    })
}

exports.deleteFile = deleteFile;