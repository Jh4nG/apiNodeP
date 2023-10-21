const { request, response, Router } = require("express");
const emailDespachosController = require("./../../controllers/email/emailDespachos.controller");

// Middleware
const middleware = require("./../../assets/middleware");

try{
    const router = Router();
    
    router.get("/", middleware.ensureAuthenticated, emailDespachosController.getData);
    router.post("/insert", middleware.ensureAuthenticated, emailDespachosController.insertData);
    router.put("/update", middleware.ensureAuthenticated, emailDespachosController.updateData);
    router.delete("/delete", middleware.ensureAuthenticated, emailDespachosController.deleteData);
    router.get("/:id", middleware.ensureAuthenticated, emailDespachosController.getDataId);
    router.post("/exportExcel", middleware.ensureAuthenticated, emailDespachosController.exportExcel);
    
    module.exports = router;
}catch(error){
    console.log(error.message);
    module.exports = error.message;
}