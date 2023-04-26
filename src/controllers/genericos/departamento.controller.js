const { getConnection } = require("./../../database/database");
const global_c = require("./../../assets/global.controller");
const { fecha_actual, fecha_actual_all, msgInsertOk, msgInsertErr, msgUpdateOk, msgUpdateErr, msgDeleteOk, msgDeleteErr, msgTry } = global_c;

const table = "adm_depto";

const getData = async (req,res) => {
    try{
        const connection = await getConnection();
        const result = await connection.query(`SELECT IdDep, departamento FROM ${table} ORDER BY departamento`);
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
        const { IdDep,departamento } = req.body;
        const result = await connection.query(`INSERT INTO ${table}(IdDep,departamento) VALUES(?,?)`, [IdDep,departamento]);
        if(result.affectedRows > 0){
            connection.end();
            return res.status(200).json({status:200, msg : `Departamento ${msgInsertOk}`});
        }
        connection.end();
        return res.status(200).json({status:400, msg : `${msgInsertErr} Departamento. ${msgTry}`});
    }catch(error){
        return res.json({ status : 500, msg : error.message});
    }
}

const updateData = async (req,res) => {
    try{
        const connection = await getConnection();
        const { IdDep,departamento } = req.body;
        const result = await connection.query(`UPDATE ${table} SET departamento = ? WHERE IdDep = ? `, [departamento,IdDep]);
        if(result.affectedRows > 0){
            connection.end();
            return res.status(200).json({status:200, msg : `Departamento ${msgUpdateOk}`});
        }
        connection.end();
        return res.status(200).json({status:400, msg : `${msgUpdateErr} Departamento. ${msgTry}`});
    }catch(error){
        return res.json({ status : 500, msg : error.message});
    }
}

const deleteData = async (req,res)=>{
    try{
        const connection = await getConnection();
        const { IdDep } = req.body;
        const result = await connection.query(`DELETE FROM ${table} WHERE IdDep = ?`,[IdDep]);
        if(result.affectedRows > 0){
            connection.end();
            return res.status(200).json({status : 200, msg : `Departamento ${msgDeleteOk}`});
        }
        connection.end();
        return res.status(400).json({status : 400, msg : `${msgDeleteErr} Departamento. ${msgTry}`});
    }catch(error){
        return res.status(500).json({ status : 500, msg : error.message });
    }
}

const getDataId = async (req,res)=>{
    try{
        const connection = await getConnection();
        const { id } = req.params;
        const result = await connection.query(`SELECT * FROM ${table} WHERE IdDep = ?`, [id]);
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