import { ModulePage } from '@/components/dashboard-content';
export default async function Page({params}:{params:Promise<{module:string}>}){const {module}=await params;return <ModulePage module={module}/>}
