const global_c = require("./../assets/global.controller");
const { generateExcel } = global_c;

const excelGeneric = async (req,res)=>{
    try{

        let { username, name_user, title_report, name_file, heads, rows } = req.body;
        heads = JSON.parse(heads);
        rows = JSON.parse(rows);        
        let {status, nameFile, url, msg} = await generateExcel(username, name_user, title_report, name_file, heads, rows);
        if(status == 200){
            return res.status(status).json({status, msg, nameFile,  url});
        }
        return res.status(status).json({status, msg});
    }catch(error){
        return res.json({ status : 500, tipousuario:"", redirect : false, msg : error.message});
    }
}

try{
    module.exports = {
        excelGeneric
    }
}catch(error){
    console.log(error.message);
    module.exports = error.message;
}