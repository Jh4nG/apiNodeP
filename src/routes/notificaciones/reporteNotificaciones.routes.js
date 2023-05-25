const { request, response, Router } = require("express");
const reporteNotificacionesController = require("./../../controllers/notificaciones/reporteNotificaciones.controller");

// Middleware
const middleware = require("./../../assets/middleware");

try{
    const router = Router();
    
    router.post("/", middleware.ensureAuthenticated, reporteNotificacionesController.getData);
    router.post("/getExpediente", middleware.ensureAuthenticated, reporteNotificacionesController.getExpediente);
    router.post("/insert", middleware.ensureAuthenticated, reporteNotificacionesController.insertData);
    router.put("/update", middleware.ensureAuthenticated, reporteNotificacionesController.updateData);
    router.delete("/delete", middleware.ensureAuthenticated, reporteNotificacionesController.deleteData);
    router.get("/:id", middleware.ensureAuthenticated, reporteNotificacionesController.getDataId);
    
    module.exports = router;
}catch(error){
    console.log(error.message);
    module.exports = error.message;
}