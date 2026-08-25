import { agents as demoAgents } from '@/lib/demo-data';
import { isDemoMode, prisma } from '@/lib/prisma';

export async function listAgents() {
  if (isDemoMode) {
    return demoAgents.map((agent, index) => ({
      id: String(index + 1),
      name: agent.name,
      email: null,
      role: index === 0 ? 'AGENCY_MANAGER' : 'AGENT',
    }));
  }

  return prisma.user.findMany({
    where: { role: { in: ['AGENCY_MANAGER', 'AGENT'] } },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: 'asc' },
  });
}
