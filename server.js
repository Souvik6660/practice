
import {app} from './app.js'
import ConnectionToDB from './config/dbconnection.js';
const PORT = process.env.PORT||5000;


app.listen(PORT,async()=>{
    await ConnectionToDB()
    console.log(`App is running at ${PORT}`);
})