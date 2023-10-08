const { request, response, Router } = require("express");
const misSolicitudesController = require("./../../controllers/reportes/misSolicitudes.controller");

// Middleware
const middleware = require("./../../assets/middleware");

try{
    const router = Router();
    
    router.post("/", middleware.ensureAuthenticated, misSolicitudesController.getData);
    router.post("/insert", middleware.ensureAuthenticated, misSolicitudesController.insertData);
    router.put("/update", middleware.ensureAuthenticated, misSolicitudesController.updateData);
    router.delete("/delete", middleware.ensureAuthenticated, misSolicitudesController.deleteData);
    router.get("/:id", middleware.ensureAuthenticated, misSolicitudesController.getDataId);
    router.post("/exportExcel", middleware.ensureAuthenticated, misSolicitudesController.exportExcel);
    
    module.exports = router;
}catch(error){
    console.log(error.message);
    module.exports = error.message;
}