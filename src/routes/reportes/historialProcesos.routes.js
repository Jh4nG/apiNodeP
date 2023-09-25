const { request, response, Router } = require("express");
const historialProcesosController = require("./../../controllers/reportes/historialProcesos.controller");

// Middleware
const middleware = require("./../../assets/middleware");

try{
    const router = Router();
    
    router.post("/", middleware.ensureAuthenticated, historialProcesosController.getData);
    router.post("/actuacion", middleware.ensureAuthenticated, historialProcesosController.getActuacion);
    router.post("/insert", middleware.ensureAuthenticated, historialProcesosController.insertData);
    router.put("/update", middleware.ensureAuthenticated, historialProcesosController.updateData);
    router.delete("/delete", middleware.ensureAuthenticated, historialProcesosController.deleteData);
    router.get("/:id", middleware.ensureAuthenticated, historialProcesosController.getDataId);
    router.post("/exportExcel", middleware.ensureAuthenticated, historialProcesosController.exportExcel);
    
    module.exports = router;
}catch(error){
    console.log(error.message);
    module.exports = error.message;
}