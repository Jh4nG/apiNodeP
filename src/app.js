const express = require ("express");
const morgan = require ("morgan");
const cors = require ('cors');

// Routes
const loginRoutes = require ("./routes/login.routes");
const userRoutes = require ("./routes/user.routes");
const audienciasRoutes = require ("./routes/audiencias/audiencias.routes");
const departamentoRoutes = require ("./routes/genericos/departamento.routes");
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
    
    // Routes
    app.use("/api/login", loginRoutes);
    app.use("/api/user", userRoutes);
    app.use("/api/audiencias", audienciasRoutes);
    app.use("/api/departamento", departamentoRoutes); 
    //FinRoutes

    // Exportando rutas
    module.exports = app;
}catch(error){
    module.exports = error.message;
}
