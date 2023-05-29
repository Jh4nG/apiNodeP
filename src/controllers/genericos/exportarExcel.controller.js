const { getConnection } = require("./../../database/database");
const global_c = require("./../../assets/global.controller");
const { fecha_actual, fecha_actual_all, msgInsertOk, msgInsertErr, msgUpdateOk, msgUpdateErr, msgDeleteOk, msgDeleteErr, msgTry } = global_c;

const exportar = async (req,res) => {
    try{
        const { name_user, name_file, heads, rows } = req.body;
        const {status, url, msg} = await global_c.generateExcel(name_user, name_file, heads, rows);
        if(status == 200){
            return res.status(status).download(url);
        }
        return res.status(status).json({status, msg});
    }catch(error){
        return res.json({ status : 500, msg : error.message});
    }
}

const deleteFile = async(req, res) => {
    try{
        const { name_file } = req.body;
        const resp = await global_c.deleteExcel(name_file);
        return res.status(resp.status).json(resp);
    }catch(error){
        return res.json({ status : 500, msg : error.message});
    }
}

try{
    module.exports = {
        exportar,
        deleteFile
    }
}catch(error){
    console.log(error.message);
    module.exports = error.message;
}