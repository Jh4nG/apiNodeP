const { request, response, Router } = require("express");
const despachoController = require("./../../controllers/genericos/despacho.controller");

// Middleware
const middleware = require("./../../assets/middleware");

try{
    const router = Router();
    
    router.get("/", middleware.ensureAuthenticated, despachoController.getData);
    router.post("/insert", middleware.ensureAuthenticated, despachoController.insertData);
    router.put("/update", middleware.ensureAuthenticated, despachoController.updateData);
    router.delete("/delete", middleware.ensureAuthenticated, despachoController.deleteData);
    router.get("/:id", middleware.ensureAuthenticated, despachoController.getDataId);
    router.get("/corp/:id", middleware.ensureAuthenticated, despachoController.getDataIdCorp);
    
    module.exports = router;
}catch(error){
    console.log(error.message);
    module.exports = error.message;
}