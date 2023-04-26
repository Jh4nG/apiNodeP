const { request, response, Router } = require("express");
const municipioController = require("./../../controllers/genericos/municipio.controller");

// Middleware
const middleware = require("./../../assets/middleware");

try{
    const router = Router();
    
    router.get("/", middleware.ensureAuthenticated, municipioController.getData);
    router.post("/insert", middleware.ensureAuthenticated, municipioController.insertData);
    router.put("/update", middleware.ensureAuthenticated, municipioController.updateData);
    router.delete("/delete", middleware.ensureAuthenticated, municipioController.deleteData);
    router.get("/:id", middleware.ensureAuthenticated, municipioController.getDataId);
    router.get("/depto/:id", middleware.ensureAuthenticated, municipioController.getDataIdDepto);
    
    module.exports = router;
}catch(error){
    console.log(error.message);
    module.exports = error.message;
}