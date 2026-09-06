import type {NextAuthConfig} from 'next-auth';

export default {
  providers:[],
  callbacks:{
    authorized({auth}){
      if(process.env.DEMO_MODE!=='false')return true;
      return Boolean(auth?.user);
    }
  }
} satisfies NextAuthConfig;
