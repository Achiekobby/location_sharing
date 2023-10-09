import { Socket } from 'socket.io';

interface ISocketInterface extends Socket{
  roomId?:string;
}

export default ISocketInterface;