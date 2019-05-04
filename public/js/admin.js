const deleteProduct = (btn) => {
    const id = btn.parentNode.querySelector('[name=id]').value;
    const csrf = btn.parentNode.querySelector('[name=_csrf]').value;
    //Xoa luon thuoc tinh trong the chua san pham 
    const productElement = btn.closest('tr');

    //ajax
    fetch('/admin/deleteproduct/' + id, {
        method: 'DELETE',
        headers: {
            'csrf-token': csrf
        }
    })
    .then(result => {
        return result.json();
    })
    .then(data => {
        // console.log(data)
        
        //Xoa thuoc tinh 
        productElement.parentNode.removeChild(productElement);
    })
    .catch(e => console.log(e))
    
}