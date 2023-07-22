const { request, response, Router } = require("express");
const listadoProcesosActivosController = require("./../../controllers/reportes/listadoProcesosActivos.controller");

// Middleware
const middleware = require("./../../assets/middleware");

try{
    const router = Router();
    
    router.post("/", middleware.ensureAuthenticated, listadoProcesosActivosController.getData);
    router.post("/insert", middleware.ensureAuthenticated, listadoProcesosActivosController.insertData);
    router.put("/update", middleware.ensureAuthenticated, listadoProcesosActivosController.updateData);
    router.delete("/delete", middleware.ensureAuthenticated, listadoProcesosActivosController.deleteData);
    router.get("/:id", middleware.ensureAuthenticated, listadoProcesosActivosController.getDataId);
    router.post("/exportExcel", middleware.ensureAuthenticated, listadoProcesosActivosController.exportExcel);
    router.post("/informeProcesal", middleware.ensureAuthenticated, listadoProcesosActivosController.getDataInformeProcesal);    
    router.post("/cmpTypeInformeProcesal", middleware.ensureAuthenticated, listadoProcesosActivosController.getDataCmpTypeInformeProcesal);
    router.post("/insertInformeProcesal", middleware.ensureAuthenticated, listadoProcesosActivosController.insertInformeProcesal);
    module.exports = router;
}catch(error){
    console.log(error.message);
    module.exports = error.message;
}