import  "dotenv.config";
import "module-alias/register";
import App from "./app";
import { Socket, Server } from 'socket.io';

const port_number:number = Number(process.env.PORT_NUMBER);
const app = new App([],port_number);

//* Listen to the server on the port specified by port_number
app.listen();

