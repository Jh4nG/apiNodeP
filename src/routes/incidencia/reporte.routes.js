const { request, response, Router } = require("express");
const reporteController = require("./../../controllers/incidencia/reporte.controller");

// Middleware
const middleware = require("./../../assets/middleware");

try{
    const router = Router();
    
    router.post("/insert", middleware.ensureAuthenticated, reporteController.reportIncidencia);
    
    module.exports = router;
}catch(error){
    console.log(error.message);
    module.exports = error.message;
}