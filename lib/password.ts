import {pbkdf2Sync,randomBytes,timingSafeEqual} from 'crypto';

const ALGORITHM='sha512';
const ITERATIONS=210_000;
const KEY_LENGTH=32;
const PREFIX='pbkdf2';

export function hashPassword(password:string){
  const salt=randomBytes(16).toString('hex');
  const hash=pbkdf2Sync(password,salt,ITERATIONS,KEY_LENGTH,ALGORITHM).toString('hex');
  return `${PREFIX}$${ITERATIONS}$${salt}$${hash}`;
}

export function verifyPassword(password:string,stored:string){
  if(stored.startsWith(`${PREFIX}$`)){
    const [prefix,iterationsRaw,salt,expectedHex]=stored.split('$');
    const iterations=Number(iterationsRaw);
    if(prefix!==PREFIX||!Number.isSafeInteger(iterations)||iterations<=0||!salt||!expectedHex)return {valid:false,legacy:false};
    try{
      const expected=Buffer.from(expectedHex,'hex');
      const actual=pbkdf2Sync(password,salt,iterations,expected.length,ALGORITHM);
      return {valid:expected.length>0&&expected.length===actual.length&&timingSafeEqual(actual,expected),legacy:false};
    }catch{return {valid:false,legacy:false};}
  }

  const actual=Buffer.from(password);
  const expected=Buffer.from(stored);
  const valid=actual.length===expected.length&&timingSafeEqual(actual,expected);
  return {valid,legacy:valid};
}
