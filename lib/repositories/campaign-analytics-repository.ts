import{prisma,isDemoMode}from'@/lib/prisma';import type{DataActor}from'@/lib/data-scope';
function costPer(channel:string){const key=channel==='SMS'?'MESSAGE_COST_SMS':channel==='WHATSAPP'?'MESSAGE_COST_WHATSAPP':'MESSAGE_COST_EMAIL';const n=Number(process.env[key]||0);return Number.isFinite(n)&&n>=0?n:0}
export async function getCampaignAnalytics(actor:DataActor){if(isDemoMode)return{summary:{campaigns:0,sent:0,delivered:0,read:0,replied:0,visits:0,contracts:0,revenue:0,cost:0,roi:null},campaigns:[]};const rows=await prisma.$queryRaw<Array<any>>`
WITH recipient_stats AS (
 SELECT c.id,c.name,c.channel,c."createdAt",c."startedAt",c."completedAt",
 COUNT(r.id)::int recipients,
 COUNT(r.id) FILTER(WHERE r.status IN ('SENT','DRY_RUN','DELIVERED','READ'))::int sent,
 COUNT(r.id) FILTER(WHERE r.status IN ('DELIVERED','READ'))::int delivered,
 COUNT(r.id) FILTER(WHERE r.status='READ')::int read
 FROM "Campaign" c LEFT JOIN "CampaignRecipient" r ON r."campaignId"=c.id
 WHERE c."agencyId"=${actor.agencyId} GROUP BY c.id
), replies AS (
 SELECT r."campaignId",COUNT(DISTINCT r."applicantId")::int replied
 FROM "CampaignRecipient" r JOIN "Communication" outc ON outc."externalId"=r."externalId"
 WHERE outc."repliedAt" IS NOT NULL GROUP BY r."campaignId"
), visits AS (
 SELECT r."campaignId",COUNT(DISTINCT f.id)::int visits
 FROM "CampaignRecipient" r JOIN "Followup" f ON f."applicantId"=r."applicantId" AND f.type='VISIT' AND f.completed=true AND f."scheduledAt">=COALESCE(r."sentAt",r."createdAt") AND f."scheduledAt"<COALESCE(r."sentAt",r."createdAt")+INTERVAL '30 days'
 GROUP BY r."campaignId"
), attributed_contracts AS (
 SELECT DISTINCT ON (ct.id) ct.id,ct.commission,ct.amount,r."campaignId"
 FROM "Contract" ct JOIN "CampaignRecipient" r ON r."applicantId"=ct."applicantId" JOIN "Campaign" c ON c.id=r."campaignId" AND c."agencyId"=${actor.agencyId}
 WHERE COALESCE(r."sentAt",r."createdAt")<=ct."contractDate" AND COALESCE(r."sentAt",r."createdAt")>=ct."contractDate"-INTERVAL '30 days'
 ORDER BY ct.id,COALESCE(r."sentAt",r."createdAt") DESC
), contracts AS (
 SELECT "campaignId",COUNT(id)::int contracts,COALESCE(SUM(amount),0)::float8 revenue,COALESCE(SUM(commission),0)::float8 commission FROM attributed_contracts GROUP BY "campaignId"
)
SELECT s.*,COALESCE(rep.replied,0)::int replied,COALESCE(v.visits,0)::int visits,COALESCE(ct.contracts,0)::int contracts,COALESCE(ct.revenue,0)::float8 revenue,COALESCE(ct.commission,0)::float8 commission
FROM recipient_stats s LEFT JOIN replies rep ON rep."campaignId"=s.id LEFT JOIN visits v ON v."campaignId"=s.id LEFT JOIN contracts ct ON ct."campaignId"=s.id ORDER BY s."createdAt" DESC LIMIT 100`;
 const campaigns=rows.map(r=>{const cost=r.sent*costPer(r.channel),roi=cost>0?(r.commission-cost)/cost*100:null;return{...r,cost,roi,deliveryRate:r.sent?Math.round(r.delivered/r.sent*1000)/10:0,readRate:r.delivered?Math.round(r.read/r.delivered*1000)/10:0,replyRate:r.sent?Math.round(r.replied/r.sent*1000)/10:0,visitRate:r.sent?Math.round(r.visits/r.sent*1000)/10:0,contractRate:r.sent?Math.round(r.contracts/r.sent*1000)/10:0}});const s=campaigns.reduce((a,x)=>({campaigns:a.campaigns+1,sent:a.sent+x.sent,delivered:a.delivered+x.delivered,read:a.read+x.read,replied:a.replied+x.replied,visits:a.visits+x.visits,contracts:a.contracts+x.contracts,revenue:a.revenue+x.revenue,commission:a.commission+x.commission,cost:a.cost+x.cost}),{campaigns:0,sent:0,delivered:0,read:0,replied:0,visits:0,contracts:0,revenue:0,commission:0,cost:0});return{summary:{...s,deliveryRate:s.sent?Math.round(s.delivered/s.sent*1000)/10:0,replyRate:s.sent?Math.round(s.replied/s.sent*1000)/10:0,contractRate:s.sent?Math.round(s.contracts/s.sent*1000)/10:0,roi:s.cost>0?(s.commission-s.cost)/s.cost*100:null},campaigns}}
