const { getConnection } = require("./../../database/database");
const global_c = require("./../../assets/global.controller");
const { fecha_actual, fecha_actual_all, msgInsertOk, msgInsertErr, msgUpdateOk, msgUpdateErr, msgDeleteOk, msgDeleteErr, msgTry } = global_c;

const table = "adm_solicitudes_procesos";
const campos = `sp_id_depto,sp_id_mun,sp_id_corporacion,sp_id_despacho,sp_demandante,sp_demandado,sp_radicacion,sp_juzgado,sp_rad_23,sp_tipo_proceso,sp_sus_ingreso,sp_etiqueta`;

const getData = async (req,res) => {
    try{
        const connection = await getConnection();
        const result = await connection.query(`SELECT * FROM ${table}`);
        let data = []
        if(result.length > 0 ){
            data = result;
        }
        connection.end();
        return res.status(200).json({status:200, data : data});
    }catch(error){
        return res.json({ status : 500, msg : error.message});
    }
}

const insertData = async (req,res) => {
    try{
        const connection = await getConnection();
        const { depto,municipio,corporacion,despacho,demandante,demandado,radicacion,juzgado_origen,codigo23,proceso,suscriptor,etiqueta } = req.body;
        let dataValida = {
            "Departamento" : depto,
            "Municipio" : municipio,
            "Corporación" : corporacion,
            "Despacho" : despacho,
            "Demandante" : demandante,
            "Demandado" : demandado,
            "Radicado" : radicacion,
            "Juzgado Origen" : juzgado_origen,
            "Radicado 23 digitos" : codigo23,
            "Proceso" : proceso,
            "Suscriptor" : suscriptor,
            "Etiqueta" : etiqueta
        };
        let valida = global_c.validateParams(dataValida);
        if(valida.status){ // Se inserta
            const result = await connection.query(`INSERT INTO ${table}(${campos}) 
                                                VALUES(?,?,?,?,?,?,?,?,?,?,?,?);`, 
                                                [depto,municipio,corporacion,despacho,demandante,demandado,radicacion,juzgado_origen,codigo23,proceso,suscriptor,etiqueta]);
            if(result.affectedRows > 0){
                const idProceso = result.insertId;
                await connection.query(`INSERT INTO adm_solicitudes_suscriptores(id_proceso, id_suscriptor)
                                        VALUES(?,?)`,[idProceso,suscriptor]);
                connection.end();
                return res.status(200).json({status:200, msg : `Proceso ${msgInsertOk}`});
            }
            connection.end();
            return res.status(400).json({status:400, msg : `${msgInsertErr} Proceso. ${msgTry}`});
        }
        return res.status(400).json({status:400, msg : valida.msg});
    }catch(error){
        return res.json({ status : 500, msg : error.message});
    }
}

const updateData = async (req,res) => {
    try{
        const connection = await getConnection();
        const { id } = req.body;
        const result = await connection.query(`UPDATE ${table} SET , WHERE id = ? `, [id]);
        if(result.affectedRows > 0){
            connection.end();
            return res.status(200).json({status:200, msg : `Proceso ${msgUpdateOk}`});
        }
        connection.end();
        return res.status(400).json({status:400, msg : `${msgUpdateErr} Proceso. ${msgTry}`});
    }catch(error){
        return res.json({ status : 500, msg : error.message});
    }
}

const deleteData = async (req,res)=>{
    try{
        const connection = await getConnection();
        const { id } = req.body;
        const result = await connection.query(`DELETE FROM ${table} WHERE id = ?`,[id]);
        if(result.affectedRows > 0){
            connection.end();
            return res.status(200).json({status : 200, msg : `Proceso ${msgDeleteOk}`});
        }
        connection.end();
        return res.status(400).json({status : 400, msg : `${msgDeleteErr} Proceso. ${msgTry}`});
    }catch(error){
        return res.status(500).json({ status : 500, msg : error.message });
    }
}

const getDataId = async (req,res)=>{
    try{
        const connection = await getConnection();
        const { id } = req.params;
        const result = await connection.query(`SELECT * FROM ${table} WHERE id = ?`, [id]);
        let data = []
        if(result.length > 0 ){
            data = result[0];
        }
        connection.end();
        return res.status(200).json({status:200, data : data});
    }catch(error){
        return res.status(500).json({ status : 500, msg : error.message });
    }
}

try{
    module.exports = {
        getData,
        insertData,
        updateData,
        deleteData,
        getDataId
    }
}catch(error){
    console.log(error.message);
    module.exports = error.message;
}