import jwt, { type JwtPayload } from "jsonwebtoken"
export const createToken = (payload: object) => {
    try{
        const {id, email} = payload as {id: string, email: string};
        const token = jwt.sign({id, email}, process.env.JWT_SECRET_KEY as string, {expiresIn: '7d'});
        return token;
    }catch(error){
        console.log(error);
    }
}

export const verifyToken = (token: string) => {
    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY as string) as JwtPayload;
        return decoded;
    }catch(error){
        console.log(error);
    }
}