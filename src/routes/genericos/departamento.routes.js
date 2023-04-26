const { request, response, Router } = require("express");
const departamentoController = require("./../../controllers/genericos/departamento.controller");

// Middleware
const middleware = require("./../../assets/middleware");

try{
    const router = Router();
    
    router.get("/", middleware.ensureAuthenticated, departamentoController.getData);
    router.post("/insert", middleware.ensureAuthenticated, departamentoController.insertData);
    router.put("/update", middleware.ensureAuthenticated, departamentoController.updateData);
    router.delete("/delete", middleware.ensureAuthenticated, departamentoController.deleteData);
    router.get("/:id", middleware.ensureAuthenticated, departamentoController.getDataId);
    
    module.exports = router;
}catch(error){
    console.log(error.message);
    module.exports = error.message;
}