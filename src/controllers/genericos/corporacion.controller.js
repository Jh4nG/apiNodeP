const { getConnection } = require("./../../database/database");
const global_c = require("./../../assets/global.controller");
const { fecha_actual, fecha_actual_all, msgInsertOk, msgInsertErr, msgUpdateOk, msgUpdateErr, msgDeleteOk, msgDeleteErr, msgTry } = global_c;

const table = "adm_corporacion";

const getData = async (req,res) => {
    try{
        const connection = await getConnection();
        const result = await connection.query(`SELECT IdCorp,corporacion FROM ${table} ORDER BY corporacion`);
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
        const { IdCorp,municipio_IdMun,corporacion } = req.body;
        const result = await connection.query(`INSERT INTO ${table}(IdCorp,municipio_IdMun,corporacion) VALUES(?,?,?)`, [IdCorp,municipio_IdMun,corporacion]);
        if(result.affectedRows > 0){
            connection.end();
            return res.status(200).json({status:200, msg : `Corporación ${msgInsertOk}`});
        }
        connection.end();
        return res.status(400).json({status:400, msg : `${msgInsertErr} Corporación. ${msgTry}`});
    }catch(error){
        return res.json({ status : 500, msg : error.message});
    }
}

const updateData = async (req,res) => {
    try{
        const connection = await getConnection();
        const { IdCorp,municipio_IdMun,corporacion } = req.body;
        const result = await connection.query(`UPDATE ${table} SET municipio_IdMun = ?,corporacion = ? WHERE IdCorp = ? `, [municipio_IdMun,corporacion,IdCorp]);
        if(result.affectedRows > 0){
            connection.end();
            return res.status(200).json({status:200, msg : `Corporación ${msgUpdateOk}`});
        }
        connection.end();
        return res.status(400).json({status:400, msg : `${msgUpdateErr} Corporación. ${msgTry}`});
    }catch(error){
        return res.json({ status : 500, msg : error.message});
    }
}

const deleteData = async (req,res)=>{
    try{
        const connection = await getConnection();
        const { IdCorp } = req.body;
        const result = await connection.query(`DELETE FROM ${table} WHERE IdCorp = ?`,[IdCorp]);
        if(result.affectedRows > 0){
            connection.end();
            return res.status(200).json({status : 200, msg : `Corporación ${msgDeleteOk}`});
        }
        connection.end();
        return res.status(400).json({status : 400, msg : `${msgDeleteErr} Corporación. ${msgTry}`});
    }catch(error){
        return res.status(500).json({ status : 500, msg : error.message });
    }
}

const getDataId = async (req,res)=>{
    try{
        const connection = await getConnection();
        const { id } = req.params;
        const result = await connection.query(`SELECT * FROM ${table} WHERE IdCorp = ?`, [id]);
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

const getDataIdMun = async (req,res)=>{
    try{
        const connection = await getConnection();
        const { id } = req.params;
        const result = await connection.query(`SELECT IdCorp,corporacion FROM ${table} WHERE municipio_IdMun = ?`, [id]);
        let data = []
        if(result.length > 0 ){
            data = result;
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
        getDataId,
        getDataIdMun
    }
}catch(error){
    console.log(error.message);
    module.exports = error.message;
}