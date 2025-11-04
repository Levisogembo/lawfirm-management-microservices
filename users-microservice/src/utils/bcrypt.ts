import * as bcrypt from 'bcryptjs'

export async function hashPassword(rawPassword:string){
    const SALT = bcrypt.genSaltSync(10)
    return bcrypt.hashSync(rawPassword,SALT) 
}

export async function comparePasswords(rawPassword:string,hashedPassword:string){
    return bcrypt.compareSync(rawPassword,hashedPassword)
}

