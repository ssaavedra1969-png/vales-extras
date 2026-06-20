'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { pdf } from '@react-pdf/renderer';
import { doc, runTransaction, addDoc, collection, Timestamp } from 'firebase/firestore';
import { getDb } from '@/lib/firebase/config';
import { parseExcelFile } from '@/lib/excel/parser';
import ValeTemplate from '@/components/vale/ValeTemplate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle2, X, Loader2 } from 'lucide-react';
import { ExcelRow, ConfigEmpresa, Vale } from '@/types';
import JSZip from 'jszip';

async function generarNumeroVale(): Promise<string> {
  const counterRef = doc(getDb(), 'contadores', 'vale_counter');

  const nuevoNumero = await runTransaction(getDb(), async (transaction) => {
    const counterDoc = await transaction.get(counterRef);
    let ultimoNumero = 0;

    if (!counterDoc.exists()) {
      transaction.set(counterRef, { ultimoNumero: 0 });
    } else {
      ultimoNumero = counterDoc.data()?.ultimoNumero ?? 0;
    }

    const siguiente = ultimoNumero + 1;
    transaction.update(counterRef, { ultimoNumero: siguiente });
    return siguiente;
  });

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const correlativo = String(nuevoNumero).padStart(5, '0');
  return `${year}${month} - ${correlativo}`;
}

export default function CargarPage() {
  const [filasValidas, setFilasValidas] = useState<ExcelRow[]>([]);
  const [filasInvalidas, setFilasInvalidas] = useState<ExcelRow[]>([]);
  const [cargando, setCargando] = useState(false);
  const [valesCreados, setValesCreados] = useState<
    { id: string; numero: string; legajo: string; empleado: string; monto: number; fechaPago: string }[]
  >([]);
  const { toast } = useToast();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          const { filasValidas, filasInvalidas } = parseExcelFile(buffer);
          setFilasValidas(filasValidas);
          setFilasInvalidas(filasInvalidas);
          setValesCreados([]);
        } catch {
          toast({
            title: 'Error al procesar',
            description: 'El archivo no tiene el formato esperado',
            variant: 'destructive',
          });
        }
      };
      reader.readAsArrayBuffer(file);
    },
    [toast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
  });

  const limpiar = () => {
    setFilasValidas([]);
    setFilasInvalidas([]);
    setValesCreados([]);
  };

  const handleUpload = async () => {
    if (filasValidas.length === 0) {
      toast({ title: 'Sin datos', description: 'No hay filas válidas', variant: 'destructive' });
      return;
    }

    setCargando(true);

    try {
      const valesRef = collection(getDb(), 'vales');
      const valesConFechas: { id: string; numero: string; legajo: string; empleado: string; monto: number; fechaPago: string }[] = [];

      for (const fila of filasValidas) {
        const numero = await generarNumeroVale();
        const docRef = await addDoc(valesRef, {
          numero,
          legajo: fila.legajo,
          empleado: fila.empleado,
          monto: fila.monto,
          fechaPago: fila.fechaPago,
          fechaGeneracion: Timestamp.now(),
          estado: 'pendiente',
        });

        valesConFechas.push({
          id: docRef.id,
          numero,
          legajo: fila.legajo,
          empleado: fila.empleado,
          monto: fila.monto,
          fechaPago: fila.fechaPago,
        });
      }

      setValesCreados(valesConFechas);

      toast({
        title: 'Vales creados',
        description: `${valesConFechas.length} vales generados`,
        variant: 'success',
      });

      const configRes = await fetch('/api/config');
      const config: ConfigEmpresa = await configRes.json();

      const zip = new JSZip();
      let pdfsOk = 0;

      for (const vale of valesConFechas) {
        try {
          const valeData: Vale = {
            id: vale.id,
            numero: vale.numero,
            legajo: vale.legajo,
            empleado: vale.empleado,
            monto: vale.monto,
            fechaPago: vale.fechaPago,
            estado: 'pendiente',
            fechaGeneracion: new Timestamp(Math.floor(Date.now() / 1000), 0),
          };

          const pdfBlob = await pdf(<ValeTemplate vale={valeData} config={config} />).toBlob();
          zip.file(`vale_${vale.numero.replace(/\s/g, '_')}.pdf`, pdfBlob);
          pdfsOk++;
        } catch (pdfError) {
          console.error(`Error en PDF para ${vale.numero}:`, pdfError);
        }
      }

      if (pdfsOk > 0) {
        const zipContent = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipContent);
        link.download = `vales_${new Date().toISOString().split('T')[0]}.zip`;
        link.click();

        toast({
          title: 'PDFs generados',
          description: `${pdfsOk} PDFs descargados en ZIP`,
          variant: 'success',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al procesar',
        variant: 'destructive',
      });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="space-y-6 relative z-10">
      <div className="animate-fadeInUp">
        <h1 className="text-2xl font-bold text-white">Cargar Excel</h1>
        <p className="text-[#B0B0D0]">Subí un archivo .xlsx o .xls con los datos de los vales</p>
      </div>

      <div className="animate-fadeInUp stagger-1">
        <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)]">
          <CardHeader>
            <CardTitle className="text-white text-lg">Seleccionar archivo</CardTitle>
            <CardDescription className="text-[#B0B0D0]">
              El archivo debe tener 4 columnas: Legajo (opcional), Nombre, Monto, Fecha de pago (dd/mm/yyyy)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={`relative border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all duration-500 ${
                isDragActive
                  ? 'border-[#00D4FF] bg-[#00D4FF]/5 shadow-[0_0_60px_rgba(0,212,255,0.2)]'
                  : 'border-white/20 bg-white/5 hover:border-[#6C3CE1]/50 hover:shadow-[0_0_40px_rgba(108,60,225,0.1)]'
              }`}
            >
              <input {...getInputProps()} />
              <div className="text-8xl mb-6 animate-bounce-slow">📂</div>
              {isDragActive ? (
                <p className="text-[#00D4FF] text-xl font-medium">📥 Soltá el archivo aquí</p>
              ) : (
                <div>
                  <p className="text-white text-xl font-medium mb-2">Arrastrá tu archivo Excel</p>
                  <p className="text-[#6B6B8A] text-sm">o hacé clic para seleccionarlo</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {(filasValidas.length > 0 || filasInvalidas.length > 0) && (
        <div className="animate-fadeInUp stagger-2">
          <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)]">
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  🔍 Previsualización
                </CardTitle>
                <CardDescription className="text-[#B0B0D0]">
                  <span className="text-green-400 font-medium">{filasValidas.length} válidas</span>
                  {filasInvalidas.length > 0 && (
                    <span className="text-red-400 font-medium ml-2">{filasInvalidas.length} con errores</span>
                  )}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {valesCreados.length === 0 && (
                  <button
                    onClick={handleUpload}
                    disabled={cargando || filasValidas.length === 0}
                    className="btn-nebula"
                  >
                    {cargando ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Procesando...</>
                    ) : (
                      <><Upload className="h-4 w-4 mr-2" /> Confirmar carga</>
                    )}
                  </button>
                )}
                {valesCreados.length > 0 && (
                  <button className="btn-nebula opacity-60 cursor-not-allowed" disabled>
                    <Download className="h-4 w-4 mr-2" /> ZIP descargado
                  </button>
                )}
                <button onClick={limpiar} disabled={cargando} className="bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300 flex items-center">
                  <X className="h-4 w-4 mr-2" /> Limpiar
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {valesCreados.length > 0 && (
                <div className="mb-4 p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl flex items-center gap-3 animate-fadeInUp">
                  <span className="text-2xl">✅</span>
                  <div className="text-sm text-green-300">
                    <strong className="text-green-200">{valesCreados.length} vales creados.</strong> Los PDFs se descargaron en un ZIP.
                    Podés ver los vales desde la sección <strong className="text-white">VALES</strong>.
                  </div>
                </div>
              )}

              {filasValidas.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                    <span className="text-green-400">✓</span> Filas válidas
                  </h4>
                  <div className="border border-white/10 rounded-xl overflow-hidden table-nebula">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead>Legajo</TableHead>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Monto</TableHead>
                          <TableHead>Fecha de pago</TableHead>
                          {valesCreados.length > 0 && <TableHead>N° Vale</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filasValidas.map((fila, idx) => (
                          <TableRow key={idx} className="border-t border-white/5">
                            <TableCell className="text-[#6B6B8A]">{idx + 1}</TableCell>
                            <TableCell className="font-mono text-xs text-[#B0B0D0]">{fila.legajo}</TableCell>
                            <TableCell className="font-medium text-white">{fila.empleado}</TableCell>
                            <TableCell className="text-[#00D4FF] font-mono">${fila.monto.toFixed(2)}</TableCell>
                            <TableCell className="text-[#B0B0D0]">{fila.fechaPago}</TableCell>
                            {valesCreados[idx] && (
                              <TableCell className="font-mono text-xs text-[#6C3CE1]">{valesCreados[idx].numero}</TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {filasInvalidas.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-red-400 mb-3 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" /> Filas con errores
                  </h4>
                  <div className="border border-red-500/20 rounded-xl overflow-hidden table-nebula">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-red-500/5">
                          <TableHead>#</TableHead>
                          <TableHead>Legajo</TableHead>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Monto</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Error</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filasInvalidas.map((fila, idx) => (
                          <TableRow key={idx} className="border-t border-red-500/10">
                            <TableCell className="text-[#6B6B8A]">{idx + 1}</TableCell>
                            <TableCell className="text-[#B0B0D0]">{fila.legajo || '-'}</TableCell>
                            <TableCell className="text-white">{fila.empleado || '(vacío)'}</TableCell>
                            <TableCell className="text-[#B0B0D0]">{fila.monto || '-'}</TableCell>
                            <TableCell className="text-[#B0B0D0]">{fila.fechaPago || '-'}</TableCell>
                            <TableCell><span className="text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">{fila.error}</span></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
