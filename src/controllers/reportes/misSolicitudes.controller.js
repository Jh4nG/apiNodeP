const { getConnection } = require("./../../database/database");
const global_c = require("./../../assets/global.controller");
const { fecha_actual, fecha_actual_all, msgInsertOk, msgInsertErr, msgUpdateOk, msgUpdateErr, msgDeleteOk, msgDeleteErr, msgTry, msgSinInfo } = global_c;

const table = "adm_solicitudes_procesos";
const query_base = `SELECT SQL_CALC_FOUND_ROWS *,
                    DATE(sp_fecha_ingreso) as fecha
                    ,CASE WHEN asp.sp_tipo = 1 THEN 'Nuevo' ELSE 'Envío Expediente' END as nameTipo
                    ,(SELECT CONCAT(group_concat(nombre),".") FROM adm_clientes WHERE cedula_nit IN(SELECT id_suscriptor FROM adm_solicitudes_suscriptores WHERE id_proceso = asp.sp_id_proceso)) as suscriptor
                    ,(SELECT departamento FROM adm_depto WHERE IdDep = asp.sp_id_depto) as depto
                    ,(SELECT municipio FROM adm_municipio WHERE IdMun = asp.sp_id_mun) as mun
                    ,(SELECT despacho FROM adm_despacho WHERE IdDes = asp.sp_id_despacho) as despacho
                    ,(SELECT nombre FROM adm_clientes WHERE cedula_nit = asp.sp_sus_ingreso) as nameSuscriptor
                    FROM ${table} asp
                    WHERE sp_ingreso_misprocesos = 0
                    AND sp_sus_ingreso IN (?)`;
const order = `ORDER BY sp_tipo,sp_id_despacho,sp_radicacion ASC`;

const getData = async (req,res) => {
    try{
        const { depto, municipio, corporacion, despacho, userChild } = req.body;
        let { group_users,parent } = req.body;
        group_users = atob(group_users).split(',');
        parent = atob(parent);
        let {status, count_rows, isParent, data, msg} = await getDataResp(parent, group_users, depto, municipio, corporacion, despacho, userChild);
        return res.status(status).json({status, count_rows, isParent, data, msg});
    }catch(error){
        return res.json({ status : 500, msg : error.message});
    }
}

const getDataResp = async (parent, group_users, depto, municipio, corporacion, despacho, userChild) =>{
    try{
        const isParent = (parent != group_users.join()) ? true : false;
        let params = (isParent) ? [group_users] : [parent];
        let sqlAdd = ``;
        if(userChild){
            params = [userChild];
        }
        if(depto){
            sqlAdd += ` AND asp.sp_id_depto = ? `;
            params.push(depto);
        }
        if(municipio){
            sqlAdd += ` AND asp.sp_id_mun = ? `;
            params.push(municipio);
        }
        if(corporacion){
            sqlAdd += ` AND asp.sp_id_corporacion = ?`;
            params.push(corporacion);
        }
        if(despacho){
            sqlAdd += ` AND asp.sp_id_despacho = ?`;
            params.push(despacho);
        }
        const connection = await getConnection();
        const result = await connection.query(`${query_base}
                                               ${order}`,params);
        const queryCount = await connection.query(`SELECT FOUND_ROWS() as cantidad`);
        let count_rows = queryCount[0].cantidad;
        let data = [];
        if(result.length > 0 ){
            connection.end();
            return {status:200, count_rows, data : result, isParent, msg : 'Generado correctamente'};
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
            return res.status(200).json({status:200, msg : `MisSolicitudes ${msgInsertOk}`});
        }
        connection.end();
        return res.status(400).json({status:400, msg : `${msgInsertErr} MisSolicitudes. ${msgTry}`});
    }catch(error){
        return res.json({ status : 500, msg : error.message});
    }
}

const updateData = async (req,res) => {
    try{
        const { sp_id_proceso, sp_radicacion, sp_rad_23  } = req.body;
        
        let dataValida = {
            "Radicado" : sp_radicacion, 
            "Radicado 23" : sp_rad_23,
        }
        let valida = global_c.validateParams(dataValida);
        let statusRad = (sp_radicacion.length == 9 && (sp_rad_23.length == 9 || sp_rad_23.length == 23) && sp_rad_23.indexOf(sp_radicacion)>=0);
        let msgStatus = (!valida.status) ? valida.msg : `El radicado de 9 digitos no coincide con el de 23 o El radicado de 23 o de 9 no cumple con la cantidad de digitos requerida`;
        if(valida.status && statusRad){ // Se actualiza
            const connection = await getConnection();
            const result = await connection.query(`UPDATE ${table} SET sp_radicacion = ?, sp_rad_23 = ? WHERE sp_id_proceso = ? `, 
                                                    [sp_radicacion, sp_rad_23, sp_id_proceso]);
            if(result.affectedRows > 0){
                connection.end();
                return res.status(200).json({status:200, msg : `Mis Solicitudes ${msgUpdateOk}`});
            }
            connection.end();
            return res.status(400).json({status:400, msg : `${msgUpdateErr} Mis Solicitudes. ${msgTry}`});
        }
        return res.status(400).json({status : 400, msg : msgStatus});
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
            return res.status(200).json({status : 200, msg : `MisSolicitudes ${msgDeleteOk}`});
        }
        connection.end();
        return res.status(400).json({status : 400, msg : `${msgDeleteErr} MisSolicitudes. ${msgTry}`});
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
        const { username, name_user, name_file, depto, municipio, corporacion, despacho, userChild } = req.body;
        let { group_users,parent } = req.body;
        group_users = atob(group_users).split(',');
        parent = atob(parent);
        const isParent = (parent != group_users.join()) ? true : false;
        let { status, data, count_rows, msg } = await getDataResp(parent, group_users, depto, municipio, corporacion, despacho, userChild);
        if(status == 200){
            if(data.length > 0){
                const title_report = "Mis Solicitudes";
                const heads = [
                    {name: "Tipo", campo : 'nameTipo', width : 15}, // Este tamaño debe ser fijo para poder respetar la imagen
                    {name: "Departamento", campo : 'depto', width : 30},
                    {name: "Ciudad", campo : 'mun', width : 15},
                    {name: "Despacho Proceso", campo : 'despacho', width : 25},
                    {name: "Radicado", campo : 'sp_radicacion', width : 20},
                    {name: "Radicado (23)", campo : 'sp_rad_23', width : 35},
                    {name: "Demandante", campo : 'sp_demandante', width : 25},
                    {name: "Demandado", campo : 'sp_demandado', width : 25},
                    {name: "Descripción", campo : 'sp_descripcion', width : 35, type : 'object'},
                    {name: "Fecha Ingreso", campo : 'fecha', width : 15, type : 'Date'},
                ];
                if(isParent){
                    heads.push(
                        {name: "Suscriptor", campo : 'nameSuscriptor', width : 25}
                    );
                }
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