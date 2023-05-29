const { request, response, Router } = require("express");
const exportarExcelController = require("./../../controllers/genericos/exportarExcel.controller");

// Middleware
const middleware = require("./../../assets/middleware");

try{
    const router = Router();
    router.post("/", middleware.ensureAuthenticated, exportarExcelController.exportar);
    router.post("/deleteFile", middleware.ensureAuthenticated, exportarExcelController.deleteFile);    
    module.exports = router;
}catch(error){
    console.log(error.message);
    module.exports = error.message;
}