const { request, response, Router } = require("express");
const impulsoProcesalController = require("./../../controllers/reportes/impulsoProcesal.controller");

// Middleware
const middleware = require("./../../assets/middleware");

try{
    const router = Router();
    
    router.get("/", middleware.ensureAuthenticated, impulsoProcesalController.getData);
    router.post("/insert", middleware.ensureAuthenticated, impulsoProcesalController.insertData);
    router.put("/update", middleware.ensureAuthenticated, impulsoProcesalController.updateData);
    router.delete("/delete", middleware.ensureAuthenticated, impulsoProcesalController.deleteData);
    router.get("/:id", middleware.ensureAuthenticated, impulsoProcesalController.getDataId);
    router.post("/exportExcel", middleware.ensureAuthenticated, impulsoProcesalController.exportExcel);
    
    module.exports = router;
}catch(error){
    console.log(error.message);
    module.exports = error.message;
}