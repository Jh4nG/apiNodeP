const { getConnection } = require("./../../database/database");
const global_c = require("./../../assets/global.controller");
const { fecha_actual, fecha_actual_all, msgInsertOk, msgInsertErr, msgUpdateOk, msgUpdateErr, msgDeleteOk, msgDeleteErr, msgTry, msgSinInfo } = global_c;

const table = "adm_despacho ad";
const query_base = `SELECT SQL_CALC_FOUND_ROWS ad.IdDes, ad.corporacion_IdCorp, ad.despacho, ad.localizacion, ad.operativo, ad.operativo_gc, ad.email, ad.telefono, ad.url_microservicio, ad.consulta_tiba, ad.tipo_revision, ad.tipo_revision_gc, ad.codigo_samai
                        ,(SELECT municipio FROM adm_municipio WHERE left(ad.IdDes,5) = IdMun) as name_ciudad
                        ,(SELECT corporacion FROM adm_corporacion WHERE left(ad.IdDes,8) = IdCorp) as name_corporacion
                        ,(SELECT departamento FROM adm_depto WHERE left(ad.IdDes,2) = IdDep) as name_departamento
                        FROM ${table}
                        WHERE 1=1
                     `;
const order = `ORDER BY ad.IdDes ASC`;
const limit = "LIMIT ?, ?";

const getData = async (req,res) => {
    try{
        const { depto, municipio, corporacion, despacho, from, rows } = req.body;
        let { group_users,parent } = req.body;
        group_users = atob(group_users).split(',');
        parent = atob(parent);
        let {status, count_rows, data, msg} = await getDataResp(depto, municipio, corporacion, despacho, from, rows);
        return res.status(status).json({status, count_rows, data, msg});
    }catch(error){
        return res.json({ status : 500, msg : error.message});
    }
}

const getDataResp = async (depto, municipio, corporacion, despacho, from = 0, rows = 0, statusLimit = true) =>{
    try{
        let params = [];
        let sqlAdd = ``;
        if(depto){
            sqlAdd += ` AND ad.IdDes LIKE ?`;
            params.push(`${depto}%`);
        }
        if(municipio){
            sqlAdd += ` AND ad.IdDes LIKE ?`;
            params.push(`${municipio}%`);
        }
        if(corporacion){
            sqlAdd += ` AND ad.IdDes LIKE ?`;
            params.push(`${corporacion}%`);
        }
        if(despacho){
            sqlAdd += ` AND ad.IdDes = ?`;
            params.push(despacho);
        }
        if(statusLimit){
            params.push(from, rows);
        }
        const connection = await getConnection();
        const result = await connection.query(`${query_base}
                                                ${sqlAdd}
                                                ${order}
                                                ${(statusLimit) ? limit : ''}`,params);
        const queryCount = await connection.query(`SELECT FOUND_ROWS() as cantidad`);
        let count_rows = queryCount[0].cantidad;
        let data = [];
        if(result.length > 0 ){
            connection.end();
            return {status:200, count_rows, data : result, msg : 'Generado correctamente'};
        }
        connection.end();
        return {status:400, count_rows, data, msg : msgSinInfo};
    }catch(error){
        return { status : 500, count_rows : 0, data : [], msg : error.message}
    }
}

const insertData = async (req,res) => {
    try{
        const connection = await getConnection();
        const { id } = req.body;
        const result = await connection.query(`INSERT INTO ${table} VALUES()`, [id]);
        if(result.affectedRows > 0){
            connection.end();
            return res.status(200).json({status:200, msg : `EmailDespachos ${msgInsertOk}`});
        }
        connection.end();
        return res.status(400).json({status:400, msg : `${msgInsertErr} EmailDespachos. ${msgTry}`});
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
            return res.status(200).json({status:200, msg : `EmailDespachos ${msgUpdateOk}`});
        }
        connection.end();
        return res.status(400).json({status:400, msg : `${msgUpdateErr} EmailDespachos. ${msgTry}`});
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
            return res.status(200).json({status : 200, msg : `EmailDespachos ${msgDeleteOk}`});
        }
        connection.end();
        return res.status(400).json({status : 400, msg : `${msgDeleteErr} EmailDespachos. ${msgTry}`});
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

const exportExcel = async (req,res) =>{
    try{
        const { username, name_user, name_file } = req.body;
        let { status, data } = await getData();
        if(status == 200){
            if(data.length > 0){
                const title_report = "EmailDespachos";
                const heads = [
                    {name: "Prueba", campo : 'name_prueba', width : 15}, // Este tamaño debe ser fijo para poder respetar la imagen
                    {name: "fechas", campo : 'fechas', width : 30, type : 'Date'},
                ];
                let {status, url, msg} = await global_c.generateExcel(username, name_user, title_report, name_file, heads, data);
                if(status == 200){
                    return res.status(status).json({status, url, msg});
                }
                return res.status(status).json({status, msg});
            }
            return res.status(status).json({status, msg});
        }
        return res.status(status).json({status, count_rows, data, msg});
    }catch(error){
        return res.status(500).json({ status : 500, msg : error.message, url : '' });
    }
}

try{
    module.exports = {
        getData,
        insertData,
        updateData,
        deleteData,
        getDataId,
        exportExcel
    }
}catch(error){
    console.log(error.message);
    module.exports = error.message;
}