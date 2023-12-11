const express = require ("express");
const morgan = require ("morgan");
const cors = require ('cors');

// Routes
const loginRoutes = require ("./routes/login.routes");
const userRoutes = require ("./routes/user.routes");
const audienciasRoutes = require ("./routes/audiencias/audiencias.routes");
const departamentoRoutes = require ("./routes/genericos/departamento.routes");
const municipioRoutes = require ("./routes/genericos/municipio.routes");
const corporacionRoutes = require ("./routes/genericos/corporacion.routes");
const despachoRoutes = require ("./routes/genericos/despacho.routes");
const reporteNotificacionesRoutes = require ("./routes/notificaciones/reporteNotificaciones.routes");
const newProcesoRoutes = require ("./routes/procesos/newProceso.routes");
const exportarExcelRoutes = require ("./routes/genericos/exportarExcel.routes");
const listadoProcesosGeneralesRoutes = require ("./routes/reportes/listadoProcesosGenerales.routes");
const listadoProcesosActivosRoutes = require ("./routes/reportes/listadoProcesosActivos.routes");
const eliminacionMasivaRoutes = require ("./routes/reportes/eliminacionMasiva.routes");
const historialProcesosRoutes = require ("./routes/reportes/historialProcesos.routes");
const misSolicitudesRoutes = require ("./routes/reportes/misSolicitudes.routes");
const impulsoProcesalRoutes = require ("./routes/reportes/impulsoProcesal.routes");
const emailDespachosRoutes = require ("./routes/email/emailDespachos.routes");
const reporteRoutes = require ("./routes/incidencia/reporte.routes");
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
    app.use("/api/municipio", municipioRoutes); 
    app.use("/api/corporacion", corporacionRoutes); 
    app.use("/api/despacho", despachoRoutes); 
    app.use("/api/reporteNotificaciones", reporteNotificacionesRoutes); 
    app.use("/api/newProceso", newProcesoRoutes); 
    app.use("/api/exportarExcel", exportarExcelRoutes); 
    app.use("/api/listadoProcesosGenerales", listadoProcesosGeneralesRoutes); 
    app.use("/api/listadoProcesosActivos", listadoProcesosActivosRoutes); 
    app.use("/api/eliminacionMasiva", eliminacionMasivaRoutes); 
    app.use("/api/historialProcesos", historialProcesosRoutes); 
    app.use("/api/misSolicitudes", misSolicitudesRoutes); 
    app.use("/api/impulsoProcesal", impulsoProcesalRoutes); 
    app.use("/api/emailDespachos", emailDespachosRoutes); 
    app.use("/api/reporte", reporteRoutes); 
    //FinRoutes

    // Exportando rutas
    module.exports = app;
}catch(error){
    module.exports = error.message;
}
