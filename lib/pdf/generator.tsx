import { pdf } from '@react-pdf/renderer';
import ValeTemplate from '@/components/vale/ValeTemplate';
import { Vale, ConfigEmpresa } from '@/types';

export async function generateValePDF(
  vale: Vale,
  config: ConfigEmpresa
): Promise<Blob> {
  const blob = await pdf(
    <ValeTemplate vale={vale} config={config} />
  ).toBlob();
  return blob;
}
