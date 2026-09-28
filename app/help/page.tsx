import type { Metadata } from 'next';
import ResourceShell from '@/components/ResourceShell';
import HelpCenter from '@/components/HelpCenter';
export const metadata: Metadata = { title: 'Help Center — Velyro Optimizer', description: 'Installation, account, device and troubleshooting guides for Velyro Optimizer.' };
export default function HelpPage() { return <ResourceShell current="help"><HelpCenter/></ResourceShell>; }
