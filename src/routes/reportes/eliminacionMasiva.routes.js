const { request, response, Router } = require("express");
const eliminacionMasivaController = require("./../../controllers/reportes/eliminacionMasiva.controller");

// Middleware
const middleware = require("./../../assets/middleware");

try{
    const router = Router();
    
    router.post("/", middleware.ensureAuthenticated, eliminacionMasivaController.getData);
    router.post("/insert", middleware.ensureAuthenticated, eliminacionMasivaController.insertData);
    router.put("/update", middleware.ensureAuthenticated, eliminacionMasivaController.updateData);
    router.delete("/delete", middleware.ensureAuthenticated, eliminacionMasivaController.deleteData);
    router.get("/:id", middleware.ensureAuthenticated, eliminacionMasivaController.getDataId);
    router.post("/exportExcel", middleware.ensureAuthenticated, eliminacionMasivaController.exportExcel);
    
    module.exports = router;
}catch(error){
    console.log(error.message);
    module.exports = error.message;
}