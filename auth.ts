import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import {prisma} from '@/lib/prisma';

export const {handlers, auth, signIn, signOut}=NextAuth({
  providers:[Credentials({
    credentials:{email:{},password:{}},
    async authorize(credentials){
      if(!credentials?.email) return null;
      const user=await prisma.user.findUnique({where:{email:String(credentials.email)}});
      if(!user) return null;
      return {id:user.id,name:user.name,email:user.email,role:user.role};
    }
  })],
  callbacks:{
    async jwt({token,user}){if(user) token.role=(user as any).role;return token},
    async session({session,token}){if(session.user)(session.user as any).role=token.role;return session}
  }
});
