const global_c = require("./../assets/global.controller");
const {
    generateExcel,
    generateExcelInformeProcesal,
    generateExcelContinue,
    generateExcelBasico,
} = global_c;

const excelGeneric = async (req, res) => {
    try {
        let { username, name_user, title_report, name_file, heads, rows } =
            req.body;
        heads = JSON.parse(heads);
        rows = JSON.parse(rows);
        let { status, nameFile, url, msg } = await generateExcel(
            username,
            name_user,
            title_report,
            name_file,
            heads,
            rows
        );
        if (status == 200) {
            return res.status(status).json({ status, msg, nameFile, url });
        }
        return res.status(status).json({ status, msg });
    } catch (error) {
        return res.json({
            status: 500,
            tipousuario: "",
            redirect: false,
            msg: error.message,
        });
    }
};

const excelInformeProcesal = async (req, res) => {
    try {
        let {
            username,
            name_user,
            title_report,
            name_file,
            cmp,
            data,
            multidata,
        } = req.body;
        cmp = JSON.parse(cmp);
        data = JSON.parse(data);
        multidata = JSON.parse(multidata);
        let { status, nameFile, url, msg } = await generateExcelInformeProcesal(
            username,
            name_user,
            title_report,
            name_file,
            cmp,
            data,
            multidata
        );
        if (status == 200) {
            return res.status(status).json({ status, msg, nameFile, url });
        }
        return res.status(status).json({ status, msg });
    } catch (error) {
        return res.json({
            status: 500,
            tipousuario: "",
            redirect: false,
            msg: error.message,
        });
    }
};

const excelGenericBasic = async (req, res) => {
    try {
        let { title_report, name_file, heads, rows } = req.body;
        heads = JSON.parse(heads);
        rows = JSON.parse(rows);
        let { status, nameFile, url, msg } = await generateExcelBasico(
            title_report,
            name_file,
            heads,
            rows
        );
        if (status == 200) {
            return res.status(status).json({ status, msg, nameFile, url });
        }
        return res.status(status).json({ status, msg });
    } catch (error) {
        return res.json({
            status: 500,
            tipousuario: "",
            redirect: false,
            msg: error.message,
        });
    }
};

const excelContinue = async (req, res) => {
    try {
        let { name_file, row, data, heads, basic } = req.body;
        data = JSON.parse(data);
        heads = JSON.parse(heads);
        let { status, nameFile, url, msg } = await generateExcelContinue(
            name_file,
            row,
            data,
            heads,
            basic
        );
        if (status == 200) {
            return res.status(status).json({ status, msg, nameFile, url });
        }
        return res.status(status).json({ status, msg });
    } catch (error) {
        return res.json({ status: 500, msg: error.message });
    }
};

try {
    module.exports = {
        excelGeneric,
        excelInformeProcesal,
        excelGenericBasic,
        excelContinue,
    };
} catch (error) {
    console.log(error.message);
    module.exports = error.message;
}
