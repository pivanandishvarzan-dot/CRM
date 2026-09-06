import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import authConfig from './auth.config';
import {prisma} from '@/lib/prisma';
import {hashPassword,verifyPassword} from '@/lib/password';

export const {handlers,auth,signIn,signOut}=NextAuth({
  ...authConfig,
  providers:[Credentials({
    credentials:{email:{},password:{}},
    async authorize(credentials){
      if(!credentials?.email||!credentials?.password)return null;
      const email=String(credentials.email).trim().toLowerCase();
      const password=String(credentials.password);
      const user=await prisma.user.findUnique({where:{email}});
      if(!user?.passwordHash)return null;

      const result=verifyPassword(password,user.passwordHash);
      if(!result.valid)return null;

      if(result.legacy){
        await prisma.user.update({where:{id:user.id},data:{passwordHash:hashPassword(password)}});
      }

      return {id:user.id,name:user.name,email:user.email,role:user.role};
    }
  })],
  callbacks:{
    ...authConfig.callbacks,
    async jwt({token,user}){
      if(user){token.userId=user.id;token.role=user.role;}
      return token;
    },
    async session({session,token}){
      if(session.user){session.user.id=String(token.userId??'');session.user.role=token.role as typeof session.user.role;}
      return session;
    }
  }
});
