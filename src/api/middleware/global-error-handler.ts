import { NextFunction, Request, Response } from "express";

const GlobalErrorHandlingMiddleware = (error: Error, req: Request, res: Response, next: NextFunction) => {
    
    switch (error.name) {
        case "NotFoundError":
            console.log(error) //! For Devs
            return res.status(404).json({ message: error.message.replace("\n", "") });
            break;

        case "ValidationError":
            console.log(error)
            return res.status(400).json({ message: error.message });
            break;    

        case "ForbiddenError":
            console.log(error)
            return res.status(403).json({ message: error.message });
            break;      

        case "Error" || "Unauthenticated":
            console.log(error)
            return res.status(401).json({ message: error.message });
            break;      
    
        default:
            console.log(error)
            return res.status(500).json({ message: error.message });
            break;
    }

    
}

export default GlobalErrorHandlingMiddleware;