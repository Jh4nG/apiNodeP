const express = require ("express");
const morgan = require ("morgan");
const cors = require ('cors');
const fileUpload = require('express-fileupload');

// Routes
const helpersRoutes = require ("./routes/helpers.routes");
//FinpathRoutes

try{
    const app = express();
    
    // Settings
    app.set("port",4000);
    app.use(cors({
        origin : '*'
    }));
    
    // Middlewares
    app.use(morgan("dev"));
    app.use(express.json());
    app.use(fileUpload());
    
    // Routes
    app.use("/api/helpers", helpersRoutes);
    //FinRoutes

    // Exportando rutas
    module.exports = app;
}catch(error){
    module.exports = error.message;
}
