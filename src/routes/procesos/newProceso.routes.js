const { request, response, Router } = require("express");
const newProcesoController = require("./../../controllers/procesos/newProceso.controller");

// Middleware
const middleware = require("./../../assets/middleware");

try{
    const router = Router();
    
    router.get("/", middleware.ensureAuthenticated, newProcesoController.getData);
    router.post("/insert", middleware.ensureAuthenticated, newProcesoController.insertData);
    router.put("/update", middleware.ensureAuthenticated, newProcesoController.updateData);
    router.delete("/delete", middleware.ensureAuthenticated, newProcesoController.deleteData);
    router.get("/:id", middleware.ensureAuthenticated, newProcesoController.getDataId);
    
    module.exports = router;
}catch(error){
    console.log(error.message);
    module.exports = error.message;
}