const { getConnection } = require("./../../database/database");
const global_c = require("./../../assets/global.controller");
const { fecha_actual, fecha_actual_all, msgInsertOk, msgInsertErr, msgUpdateOk, msgUpdateErr, msgDeleteOk, msgDeleteErr, msgTry, msgSinInfo,convetirFecha } = global_c;

const table = "adm_operativos_misprocesos aop";
const campos = `aop.id_userope, aop.user_operativo, aop.despacho, aop.radicacion, aop.fecha_registro, aop.usuario, aop.proceso, aop.demandante, aop.demandado, aop.codigo_23,
(SELECT fechapublicacion FROM adm_planillas WHERE radicacion = aop.radicacion AND despacho = aop.despacho 
    ORDER BY fechapublicacion DESC LIMIT 1) as fecha_ultima_actuacion`;
const addCamposInner = `,am.municipio as name_ciudad,ad.despacho as name_despacho`;
const addTableInner = `, adm_despacho ad, adm_municipio am`;
const addInner = `AND aop.despacho = ad.IdDes
                  AND left(ad.IdDes,5) = am.IdMun`; 
const query_base = `SELECT SQL_CALC_FOUND_ROWS ${campos}
                    ${addCamposInner}
                    FROM ${table}, adm_planillas ap ${addTableInner}
                    WHERE aop.despacho = ap.despacho
                    AND aop.radicacion = ap.radicacion
                    ${addInner}
                    AND usuario IN (?) `;
const order = `ORDER BY aop.despacho,aop.radicacion ASC`;
const limit = "LIMIT ?, ?";

const getData = async (req,res) => {
    try{
        const { depto, municipio, corporacion, despacho, rango, from, rows } = req.body;
        let { group_users,parent } = req.body;
        group_users = atob(group_users).split(',');
        parent = atob(parent);
        let {status, count_rows, data, msg} = await getDataResp(depto, municipio, corporacion, despacho, rango, group_users, from, rows);
        return res.status(status).json({status, count_rows, data, msg});
    }catch(error){
        return res.json({ status : 500, msg : error.message});
    }
}

const getDataResp = async (depto, municipio, corporacion, despacho, rango, group_users, from = 0, rows = 0, statusLimit = true) =>{
    try{
        let query = query_base;
        let params = [group_users];
        let sqlAdd = ``;
        if(depto){
            sqlAdd += ` AND aop.despacho LIKE ?`;
            params.push(`${depto}%`);
        }
        if(municipio){
            sqlAdd += ` AND aop.despacho LIKE ?`;
            params.push(`${municipio}%`);
        }
        if(corporacion){
            sqlAdd += ` AND aop.despacho LIKE ?`;
            params.push(`${corporacion}%`);
        }
        if(despacho){
            sqlAdd += ` AND aop.despacho = ?`;
            params.push(despacho);
        }
        if(statusLimit){
            params.push(from, rows);
        }
        let sqlPrincipal = ` AND fechapublicacion BETWEEN DATE(DATE_SUB(NOW(),INTERVAL 30 DAY)) AND NOW()
        GROUP BY ap.radicacion,ap.despacho `;
        switch(rango){
            case '0': // Sin reporte
                sqlAdd += " AND fechapublicacion BETWEEN DATE(DATE_SUB(NOW(),INTERVAL 30 DAY)) AND NOW()";
                break;
            case '1':
                sqlAdd += sqlPrincipal;
                break;
            case '2':
                sqlAdd += ` AND fechapublicacion BETWEEN DATE(DATE_SUB(NOW(),INTERVAL 60 DAY)) AND DATE(DATE_SUB(NOW(),INTERVAL 31 DAY))
                            GROUP BY ap.radicacion,ap.despacho 
                            HAVING aop.radicacion NOT IN(( 
                                SELECT ap.radicacion 
                                FROM adm_planillas ap2 
                                WHERE aop.despacho = ap2.despacho 
                                AND aop.radicacion = ap2.radicacion 
                                AND ap2.fechapublicacion >= DATE(DATE_SUB(NOW(),INTERVAL 30 DAY)) 
                            ))`;
                break;
            case '3':
                sqlAdd += `AND fechapublicacion <= DATE(DATE_SUB(NOW(),INTERVAL 61 DAY))
                            GROUP BY ap.radicacion,ap.despacho 
                            HAVING aop.radicacion NOT IN(( 
                                SELECT ap.radicacion 
                                FROM adm_planillas ap2 
                                WHERE aop.despacho = ap2.despacho 
                                AND aop.radicacion = ap2.radicacion 
                                AND ap2.fechapublicacion >= DATE(DATE_SUB(NOW(),INTERVAL 60 DAY)) 
                            )) `;
                break;
            case '4':
                query = `SELECT SQL_CALC_FOUND_ROWS ${campos}
                            ${addCamposInner}
                            FROM ${table} ${addTableInner}
                            WHERE usuario IN (?)
                            ${addInner}
                            HAVING radicacion NOT IN (SELECT ap.radicacion FROM adm_planillas ap WHERE ap.radicacion = aop.radicacion AND ap.despacho = aop.despacho) `;
                break;
            case '5':
                query = `SELECT SQL_CALC_FOUND_ROWS ${campos}
                            ${addCamposInner}
                            FROM ${table} ${addTableInner}
                            WHERE usuario IN (?) 
                            ${addInner}`;
                break;
            default:
                sqlAdd += sqlPrincipal;
                break;
        }
        const connection = await getConnection();
        const result = await connection.query(`${query}
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
            return res.status(200).json({status:200, msg : `ImpulsoProcesal ${msgInsertOk}`});
        }
        connection.end();
        return res.status(400).json({status:400, msg : `${msgInsertErr} ImpulsoProcesal. ${msgTry}`});
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
            return res.status(200).json({status:200, msg : `ImpulsoProcesal ${msgUpdateOk}`});
        }
        connection.end();
        return res.status(400).json({status:400, msg : `${msgUpdateErr} ImpulsoProcesal. ${msgTry}`});
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
            return res.status(200).json({status : 200, msg : `ImpulsoProcesal ${msgDeleteOk}`});
        }
        connection.end();
        return res.status(400).json({status : 400, msg : `${msgDeleteErr} ImpulsoProcesal. ${msgTry}`});
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
        const { depto, municipio, corporacion, despacho, rango, username, name_user, name_file } = req.body;
        let { group_users,parent } = req.body;
        group_users = atob(group_users).split(',');
        parent = atob(parent);
        let {status, count_rows, data, msg} = await getDataResp(depto, municipio, corporacion, despacho, rango, group_users, 0, 0, false);
        if(status == 200){
            if(data.length > 0){
                const connection = await getConnection();
                const title_report = "Impulso Procesal";
                const cUltimos = 10;
                const queryBase = `SELECT descripcion,fechapublicacion 
                                    ,(SELECT notificacion FROM adm_notificacion where id_notificacion=adm_planillas.notificacion) as notificacion
                                    FROM adm_planillas WHERE radicacion=? and despacho=? ORDER BY fechapublicacion DESC LIMIT ${cUltimos}`;
                const heads = [
                    {name: "Ciudad", campo : 'name_ciudad', width : 15}, // Este tamaño debe ser fijo para poder respetar la imagen
                    {name: "Despacho", campo : 'name_despacho', width : 30},
                    {name: "Radicación", campo : 'radicacion', width : 15},
                    {name: "Tipo Proceso", campo : 'proceso', width : 25},
                    {name: "Demandante", campo : 'demandante', width : 30},
                    {name: "Demandado", campo : 'demandado', width : 33},
                    {name: "23 Digitos", campo : 'codigo_23', width : 35},
                    {name: "Fecha de Registro", campo : 'fecha_ultima_actuacion', width : 25, type : 'Date'},
                ];
                for(let i = 1; i<=cUltimos; i++){
                    heads.push({name: `Notificaion ${i}`, campo : `notificacion${i}`, width : 35});
                    heads.push({name: `Descripcion ${i}`, campo : `descripcion${i}`, width : 35});
                    heads.push({name: `Fecha ${i}`, campo : `fecha${i}`, width : 35});
                }
                for(let i = 0; i < data.length; i++){
                    let {radicacion,despacho} = data[i];
                    let query = await connection.query(queryBase,[radicacion,despacho]);
                    for(let q=0;q<cUltimos;q++){
                        data[i][`notificacion${(q+1)}`] = (query[q]) ? query[q].notificacion : '';
                        data[i][`descripcion${(q+1)}`] = (query[q]) ? query[q].descripcion : '';
                        data[i][`fecha${(q+1)}`] = (query[q]) ? convetirFecha(query[q].fechapublicacion) : '';
                    }
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