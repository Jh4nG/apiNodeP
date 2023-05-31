const { request, response, Router } = require("express");
const listadoProcesosGeneralesController = require("./../../controllers/reportes/listadoProcesosGenerales.controller");

// Middleware
const middleware = require("./../../assets/middleware");

try{
    const router = Router();
    
    router.post("/", middleware.ensureAuthenticated, listadoProcesosGeneralesController.getData);
    router.post("/insert", middleware.ensureAuthenticated, listadoProcesosGeneralesController.insertData);
    router.put("/update", middleware.ensureAuthenticated, listadoProcesosGeneralesController.updateData);
    router.delete("/delete", middleware.ensureAuthenticated, listadoProcesosGeneralesController.deleteData);
    router.get("/:id", middleware.ensureAuthenticated, listadoProcesosGeneralesController.getDataId);
    router.post("/exportExcel", middleware.ensureAuthenticated, listadoProcesosGeneralesController.exportExcel);
    
    module.exports = router;
}catch(error){
    console.log(error.message);
    module.exports = error.message;
}