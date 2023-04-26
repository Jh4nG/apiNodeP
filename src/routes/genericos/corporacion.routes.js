const { request, response, Router } = require("express");
const corporacionController = require("./../../controllers/genericos/corporacion.controller");

// Middleware
const middleware = require("./../../assets/middleware");

try{
    const router = Router();
    
    router.get("/", middleware.ensureAuthenticated, corporacionController.getData);
    router.post("/insert", middleware.ensureAuthenticated, corporacionController.insertData);
    router.put("/update", middleware.ensureAuthenticated, corporacionController.updateData);
    router.delete("/delete", middleware.ensureAuthenticated, corporacionController.deleteData);
    router.get("/:id", middleware.ensureAuthenticated, corporacionController.getDataId);
    router.get("/mun/:id", middleware.ensureAuthenticated, corporacionController.getDataIdMun);
    
    module.exports = router;
}catch(error){
    console.log(error.message);
    module.exports = error.message;
}