import { authenticator } from 'otplib';
import { createHash, randomBytes } from 'crypto';

export function generateTwoFactorSecret(){return authenticator.generateSecret()}
export function twoFactorUri(email:string,secret:string){return authenticator.keyuri(email,'KhaneYar CRM',secret)}
export function verifyTotp(token:string,secret:string){try{return authenticator.verify({token:token.replace(/\s/g,''),secret})}catch{return false}}
export function generateRecoveryCodes(count=8){return Array.from({length:count},()=>`${randomBytes(3).toString('hex').toUpperCase()}-${randomBytes(3).toString('hex').toUpperCase()}`)}
export function hashRecoveryCode(code:string){return createHash('sha256').update(code.replace(/\s/g,'').toUpperCase()).digest('hex')}
