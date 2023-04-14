const { getConnection } = require("./../../database/database");
const global_c = require("./../../assets/global.controller");
const { fecha_actual, fecha_actual_all, msgInsertOk, msgInsertErr, msgUpdateOk, msgUpdateErr, msgDeleteOk, msgDeleteErr } = global_c;

const base_query = `SELECT 
                    vt.id_vencimiento,vt.username,vt.ciudad,vt.despacho,vt.radicacion,vt.fecha_registro,vt.usuario,vt.proceso,vt.demandante,vt.demandado,vt.fecha_vence_terminos,vt.descripcion_vence_terminos,vt.idplanilla,vt.idevents,
                    am.municipio as nameCiudad,
                    ad.despacho as nameDespacho
                    FROM adm_vencimiento_terminos vt
                    INNER JOIN adm_municipio am ON vt.ciudad = am.IdMun
                    INNER JOIN adm_despacho ad ON vt.despacho = ad.IdDes`;

const getVencimientos = async (req,res) =>{
    try{
        const connection = await getConnection();
        const { user } = req.params;
        const result = await connection.query(`${base_query}
                                                WHERE vt.username = ? 
                                                AND DATE(vt.fecha_vence_terminos) >= ?
                                                ORDER BY vt.despacho, vt.radicacion, vt.fecha_vence_terminos DESC
                                                LIMIT 5`,[user,fecha_actual]);
        if(result.length > 0){
            return res.json({ status : 200, data : result[0]});
        }
        return res.json({ status : 200, data : [], msg : "Sin información"});
    }catch(error){
        res.json({ status : 500, msg : error.message});
    }
}

const getAudiencias = async (req, res) => {
    try{
        const connection = await getConnection();
        const { username,fi,ff } = req.body;

        const result = await connection.query(`${base_query}
                                                WHERE username = ? 
                                                AND DATE(fecha_vence_terminos) BETWEEN ? AND ? 
                                                ORDER BY vt.despacho, vt.radicacion, vt.fecha_vence_terminos DESC`,[username,fi,ff]);
        if(result.length > 0){
            return res.json({ status : 200, data : result[0]});
        }
        return res.status(200).json({ status : 200, data : [], msg : "Sin información"});
    }catch(error){
        return res.status(500).json({ status : 500, msg : error.message });
    }
}

const getAudienciasId = async (req,res) =>{
    try{
        const connection = await getConnection();
        const { username,id } = req.params;
        const result = await connection.query(`${base_query}
                                                WHERE username = ? 
                                                AND vt.id_vencimiento = ?
                                                ORDER BY vt.despacho, vt.radicacion, vt.fecha_vence_terminos DESC`,[username,id]);
        if(result.length > 0){
            return res.json({ status : 200, data : result[0]});
        }
        return res.status(200).json({ status : 200, data : [], msg : "Sin información"});
    }catch(error){
        return res.status(500).json({ status : 500, msg : error.message });
    }
}

const updateAudiencias = async (req,res)=>{
    try{
        const connection = await getConnection();
        const { username,fecha_vence_terminos,descripcion_vence_terminos,id_vencimiento } = req.body;
        let dataValida = {
            'Usuario' : username,
            'Fecha Audiencia / Vencimiento' : fecha_vence_terminos,
            'Detalle Audiencia Vencimiento' : descripcion_vence_terminos,
            'Id vencimiento' : id_vencimiento
        };
        let valida = global_c.validateParams(dataValida);
        if(valida.status){ // Se actualiza
            // terminar query
            return res.status(200).json({status : 200, msg : `Audiencia ${msgUpdateOk}`});
        }
        return res.status(400).json({status : 400, msg : valida.msg});
    }catch(error){
        return res.status(500).json({ status : 500, msg : error.message });
    }
}

try{
    module.exports = {
        getAudiencias,
        getVencimientos,
        getAudienciasId,
        updateAudiencias
    }
}catch(error){
    console.log(error.message);
    module.exports = error.message;
}