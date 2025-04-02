const { request, response, Router } = require("express");
const helperController = require("../controllers/helpers.controller");

// Middleware
const middleware = require("../assets/middleware");

try{
    const router = Router();
    
    // router.post("/exportExcelGeneric", middleware.ensureAuthenticated, excelGeneric);
    router.post("/exportExcelGeneric", helperController.excelGeneric);
    
    module.exports = router;
}catch(error){
    console.log(error.message);
    module.exports = error.message;
}