import * as bcrypt from 'bcryptjs'

export async function comparePasswords(rawPassword:string,hashedPassword:string){
    return bcrypt.compareSync(rawPassword,hashedPassword)
}