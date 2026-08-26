type Bucket={count:number;resetAt:number};
const buckets=new Map<string,Bucket>();
export function clientIp(request:Request){const h=request.headers;return (h.get('x-forwarded-for')?.split(',')[0]||h.get('x-real-ip')||'unknown').trim()}
export function rateLimit(key:string,limit=60,windowMs=60_000){const now=Date.now();const current=buckets.get(key);if(!current||current.resetAt<=now){buckets.set(key,{count:1,resetAt:now+windowMs});return{ok:true,remaining:limit-1,retryAfter:0}}current.count++;if(current.count>limit)return{ok:false,remaining:0,retryAfter:Math.ceil((current.resetAt-now)/1000)};return{ok:true,remaining:Math.max(0,limit-current.count),retryAfter:0}}
export function sameOrigin(request:Request){if(['GET','HEAD','OPTIONS'].includes(request.method))return true;const origin=request.headers.get('origin');if(!origin)return true;try{return new URL(origin).host===new URL(request.url).host}catch{return false}}
export function securityHeaders(){return{'X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'strict-origin-when-cross-origin','Permissions-Policy':'camera=(), microphone=(), geolocation=()','Cross-Origin-Opener-Policy':'same-origin'}}
