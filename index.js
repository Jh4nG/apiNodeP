const app = require('./src/app');

const main = () =>{
    app.listen(app.get("port"));
    console.log(`Server on port ${app.get('port')}`);
};

main();