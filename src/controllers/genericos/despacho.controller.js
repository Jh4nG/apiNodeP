const { getConnection } = require("./../../database/database");
const global_c = require("./../../assets/global.controller");
const { fecha_actual, fecha_actual_all, msgInsertOk, msgInsertErr, msgUpdateOk, msgUpdateErr, msgDeleteOk, msgDeleteErr, msgTry } = global_c;

const table = "adm_despacho";
const campos = `IdDes, despacho`;
const campos_all = `IdDes, corporacion_IdCorp, despacho, localizacion, operativo, operativo_gc, email, telefono, url_microservicio, consulta_tiba, tipo_revision, tipo_revision_gc, codigo_samai`;

const getData = async (req,res) => {
    try{
        const connection = await getConnection();
        const result = await connection.query(`SELECT ${campos} FROM ${table} ORDER BY despacho`);
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
        const { IdDes, corporacion_IdCorp, despacho, localizacion, operativo, operativo_gc, email, telefono, url_microservicio, consulta_tiba, tipo_revision, tipo_revision_gc, codigo_samai } = req.body;
        let dataValida = {
            "Id despacho" : IdDes,
            "Id Corporación" : corporacion_IdCorp,
            "Nombre despacho" : despacho,
            "localizacion" : localizacion,
            "Operativo" : operativo,
            "Email" : email,
            "Telefono" : telefono
        };
        let valida = global_c.validateParams(dataValida);
        if(valida.status){ // Se inserta
            const connection = await getConnection();
            const data = [IdDes, corporacion_IdCorp, despacho, localizacion, operativo, operativo_gc, email, telefono, url_microservicio, consulta_tiba, tipo_revision, tipo_revision_gc, codigo_samai];
            const result = await connection.query(`INSERT INTO ${table}(${campos_all}) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`, data);
            if(result.affectedRows > 0){
                connection.end();
                return res.status(200).json({status:200, msg : `Despacho ${msgInsertOk}`});
            }
            connection.end();
            return res.status(400).json({status:400, msg : `${msgInsertErr} Despacho. ${msgTry}`});
        }
        return res.status(400).json({status:400, msg : valida.msg});
    }catch(error){
        return res.json({ status : 500, msg : error.message});
    }
}

const updateData = async (req,res) => {
    try{
        const connection = await getConnection();
        const { IdDes, corporacion_IdCorp, despacho, localizacion, operativo, operativo_gc, email, telefono, url_microservicio, frecuencia_digitacion, tipo_revision, tipo_revision_gc, codigo_samai } = req.body;
        let dataValida = {
            "Id despacho" : IdDes,
            "Id Corporación" : corporacion_IdCorp,
            "Nombre despacho" : despacho,
            "localizacion" : localizacion,
            "Operativo" : operativo,
            "Email" : email,
            "Telefono" : telefono
        };
        let valida = global_c.validateParams(dataValida);
        if(valida.status){ // Se inserta
            const data = [corporacion_IdCorp, despacho, localizacion, operativo, operativo_gc, email, telefono, url_microservicio, frecuencia_digitacion, tipo_revision, tipo_revision_gc, codigo_samai, IdDes];
            const result = await connection.query(`UPDATE ${table} SET corporacion_IdCorp = ?, despacho = ?, localizacion = ?, operativo = ?, operativo_gc = ?, email = ?, telefono = ?, url_microservicio = ?, frecuencia_digitacion = ?, tipo_revision = ?, tipo_revision_gc = ?, codigo_samai = ? WHERE IdDes = ? `, data);
            if(result.affectedRows > 0){
                connection.end();
                return res.status(200).json({status:200, msg : `Despacho ${msgUpdateOk}`});
            }
            connection.end();
            return res.status(400).json({status:400, msg : `${msgUpdateErr} Despacho. ${msgTry}`});
        }
        return res.status(400).json({status:400, msg : valida.msg});
    }catch(error){
        return res.json({ status : 500, msg : error.message});
    }
}

const deleteData = async (req,res)=>{
    try{
        const connection = await getConnection();
        const { IdDes } = req.body;
        const result = await connection.query(`DELETE FROM ${table} WHERE IdDes = ?`,[IdDes]);
        if(result.affectedRows > 0){
            connection.end();
            return res.status(200).json({status : 200, msg : `Despacho ${msgDeleteOk}`});
        }
        connection.end();
        return res.status(400).json({status : 400, msg : `${msgDeleteErr} Despacho. ${msgTry}`});
    }catch(error){
        return res.status(500).json({ status : 500, msg : error.message });
    }
}

const getDataId = async (req,res)=>{
    try{
        const connection = await getConnection();
        const { id } = req.params;
        const result = await connection.query(`SELECT * FROM ${table} WHERE IdDes = ?`, [id]);
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

const getDataIdCorp = async (req,res)=>{
    try{
        const connection = await getConnection();
        const { id } = req.params;
        const result = await connection.query(`SELECT ${campos} FROM ${table} WHERE corporacion_IdCorp = ?`, [id]);
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
        getDataIdCorp
    }
}catch(error){
    console.log(error.message);
    module.exports = error.message;
}