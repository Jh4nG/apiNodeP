const { getConnection } = require("./../../database/database");
const global_c = require("./../../assets/global.controller");
const { fecha_actual, fecha_actual_all, msgInsertOk, msgInsertErr, msgUpdateOk, msgUpdateErr, msgDeleteOk, msgDeleteErr, msgTry } = global_c;

const table = "adm_municipio";

const getData = async (req,res) => {
    try{
        const connection = await getConnection();
        const result = await connection.query(`SELECT IdMun,municipio FROM ${table} ORDER BY municipio`);
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
        const { IdMun,depto_IdDep,municipio } = req.body;
        const result = await connection.query(`INSERT INTO ${table}(IdMun,depto_IdDep,municipio) VALUES(?,?,?)`, [IdMun,depto_IdDep,municipio]);
        if(result.affectedRows > 0){
            connection.end();
            return res.status(200).json({status:200, msg : `Municipio ${msgInsertOk}`});
        }
        connection.end();
        return res.status(400).json({status:400, msg : `${msgInsertErr} Municipio. ${msgTry}`});
    }catch(error){
        return res.json({ status : 500, msg : error.message});
    }
}

const updateData = async (req,res) => {
    try{
        const connection = await getConnection();
        const { IdMun,depto_IdDep,municipio } = req.body;
        const result = await connection.query(`UPDATE ${table} SET depto_IdDep = ?,municipio = ? WHERE IdMun = ? `, [depto_IdDep,municipio,IdMun]);
        if(result.affectedRows > 0){
            connection.end();
            return res.status(200).json({status:200, msg : `Municipio ${msgUpdateOk}`});
        }
        connection.end();
        return res.status(400).json({status:400, msg : `${msgUpdateErr} Municipio. ${msgTry}`});
    }catch(error){
        return res.json({ status : 500, msg : error.message});
    }
}

const deleteData = async (req,res)=>{
    try{
        const connection = await getConnection();
        const { IdMun } = req.body;
        const result = await connection.query(`DELETE FROM ${table} WHERE IdMun = ?`,[IdMun]);
        if(result.affectedRows > 0){
            connection.end();
            return res.status(200).json({status : 200, msg : `Municipio ${msgDeleteOk}`});
        }
        connection.end();
        return res.status(400).json({status : 400, msg : `${msgDeleteErr} Municipio. ${msgTry}`});
    }catch(error){
        return res.status(500).json({ status : 500, msg : error.message });
    }
}

const getDataId = async (req,res)=>{
    try{
        const connection = await getConnection();
        const { id } = req.params;
        const result = await connection.query(`SELECT * FROM ${table} WHERE idMun = ?`, [id]);
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

const getDataIdDepto = async (req,res)=>{
    try{
        const connection = await getConnection();
        const { id } = req.params;
        const result = await connection.query(`SELECT IdMun,municipio FROM ${table} WHERE depto_IdDep = ?`, [id]);
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
        getDataIdDepto
    }
}catch(error){
    console.log(error.message);
    module.exports = error.message;
}