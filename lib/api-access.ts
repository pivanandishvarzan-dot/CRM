import {auth} from '@/auth';
import {hasPermission,Permission} from '@/lib/permissions';

export async function requireApiPermission(permission:Permission){
 const session=await auth();
 const role=(session?.user as any)?.role;
 if(!session?.user || !hasPermission(role,permission)){
  throw new Error('دسترسی غیرمجاز');
 }
 return session;
}

export async function getSessionRole(){
 const session=await auth();
 return (session?.user as any)?.role ?? null;
}
