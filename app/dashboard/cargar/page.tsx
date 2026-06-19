'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { pdf } from '@react-pdf/renderer';
import { doc, runTransaction, collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import ValeTemplate from '@/components/vale/ValeTemplate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle2, X, Loader2 } from 'lucide-react';
import { ExcelRow, ConfigEmpresa, Vale } from '@/types';
import { format, parse } from 'date-fns';
import JSZip from 'jszip';

function parseExcelFile(buffer: ArrayBuffer): {
  filasValidas: ExcelRow[];
  filasInvalidas: ExcelRow[];
} {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1 });

  const filasValidas: ExcelRow[] = [];
  const filasInvalidas: ExcelRow[] = [];

  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || row.length < 3) continue;

    const empleado = String(row[0] || '').trim();
    const montoRaw = row[1];
    const fechaRaw = row[2];
    const errores: string[] = [];

    if (!empleado) errores.push('Nombre vacío');

    let monto = 0;
    if (montoRaw === undefined || montoRaw === null || montoRaw === '') {
      errores.push('Monto vacío');
    } else {
      monto = parseFloat(String(montoRaw).replace(',', '.'));
      if (isNaN(monto) || monto <= 0) errores.push('Monto inválido o negativo');
    }

    let fechaPago = '';
    if (!fechaRaw || fechaRaw === '') {
      errores.push('Fecha vacía');
    } else {
      const fechaStr = String(fechaRaw).trim();
      const parsedDate = parse(fechaStr, 'dd/MM/yyyy', new Date());
      if (isNaN(parsedDate.getTime())) {
        errores.push('Formato inválido (dd/mm/yyyy)');
      } else {
        fechaPago = format(parsedDate, 'dd/MM/yyyy');
      }
    }

    const rowData: ExcelRow = { empleado, monto, fechaPago };
    if (errores.length > 0) {
      rowData.error = errores.join('; ');
      filasInvalidas.push(rowData);
    } else {
      filasValidas.push(rowData);
    }
  }

  return { filasValidas, filasInvalidas };
}

async function generarNumeroVale(): Promise<string> {
  const counterRef = doc(db, 'contadores', 'vale_counter');

  const nuevoNumero = await runTransaction(db, async (transaction) => {
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

  return `FALPAT-${year}-${month}-${correlativo}`;
}

export default function CargarPage() {
  const [filasValidas, setFilasValidas] = useState<ExcelRow[]>([]);
  const [filasInvalidas, setFilasInvalidas] = useState<ExcelRow[]>([]);
  const [cargando, setCargando] = useState(false);
  const [valesCreados, setValesCreados] = useState<
    { id: string; numero: string; empleado: string; monto: number; fechaPago: string }[]
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
      const valesRef = collection(db, 'vales');
      const valesConFechas: { id: string; numero: string; empleado: string; monto: number; fechaPago: string }[] = [];

      for (const fila of filasValidas) {
        const numero = await generarNumeroVale();
        const docRef = await addDoc(valesRef, {
          numero,
          empleado: fila.empleado,
          monto: fila.monto,
          fechaPago: fila.fechaPago,
          fechaGeneracion: Timestamp.now(),
          estado: 'pendiente',
          mesDescuento: '',
        });

        valesConFechas.push({
          id: docRef.id,
          numero,
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
            empleado: vale.empleado,
            monto: vale.monto,
            fechaPago: vale.fechaPago,
            estado: 'pendiente',
            fechaGeneracion: new Timestamp(Math.floor(Date.now() / 1000), 0),
          };

          const pdfBlob = await pdf(<ValeTemplate vale={valeData} config={config} />).toBlob();
          zip.file(`vale_${vale.numero}.pdf`, pdfBlob);
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cargar Excel</h1>
        <p className="text-muted-foreground">Sube un archivo .xlsx o .xls con los datos de los vales</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Seleccionar archivo</CardTitle>
          <CardDescription>
            El archivo debe tener 3 columnas: Nombre, Monto, Fecha de pago (dd/mm/yyyy)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-accent bg-accent/5'
                : 'border-muted-foreground/25 hover:border-accent/50'
            }`}
          >
            <input {...getInputProps()} />
            <FileSpreadsheet className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-accent font-medium">Suelta el archivo aquí...</p>
            ) : (
              <div>
                <p className="text-muted-foreground mb-1">Arrastra y suelta tu archivo Excel aquí</p>
                <p className="text-xs text-muted-foreground/60">o haz clic para seleccionar</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {(filasValidas.length > 0 || filasInvalidas.length > 0) && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="text-lg">Previsualización</CardTitle>
              <CardDescription>
                <span className="text-green-600 font-medium">{filasValidas.length} válidas</span>
                {filasInvalidas.length > 0 && (
                  <span className="text-red-600 font-medium ml-2">{filasInvalidas.length} con errores</span>
                )}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {valesCreados.length === 0 && (
                <Button onClick={handleUpload} disabled={cargando || filasValidas.length === 0}>
                  {cargando ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Procesando...</>
                  ) : (
                    <><Upload className="h-4 w-4 mr-2" /> Confirmar carga</>
                  )}
                </Button>
              )}
              {valesCreados.length > 0 && (
                <Button variant="accent" disabled>
                  <Download className="h-4 w-4 mr-2" /> ZIP descargado
                </Button>
              )}
              <Button variant="outline" onClick={limpiar} disabled={cargando}>
                <X className="h-4 w-4 mr-2" /> Limpiar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {valesCreados.length > 0 && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                <div className="text-sm text-green-800 dark:text-green-200">
                  <strong>{valesCreados.length} vales creados.</strong> Los PDFs se descargaron en un ZIP.
                  Podés ver los vales desde el <strong>Historial</strong>.
                </div>
              </div>
            )}

            {filasValidas.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">Filas válidas</h4>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Empleado</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>Fecha de pago</TableHead>
                        {valesCreados.length > 0 && <TableHead>N° Vale</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filasValidas.map((fila, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                          <TableCell className="font-medium">{fila.empleado}</TableCell>
                          <TableCell>${fila.monto.toFixed(2)}</TableCell>
                          <TableCell>{fila.fechaPago}</TableCell>
                          {valesCreados[idx] && (
                            <TableCell className="font-mono text-xs">{valesCreados[idx].numero}</TableCell>
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
                <h4 className="text-sm font-medium text-red-600 mb-2 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" /> Filas con errores
                </h4>
                <div className="border border-red-200 rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-red-50 dark:bg-red-950">
                        <TableHead>#</TableHead>
                        <TableHead>Empleado</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Error</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filasInvalidas.map((fila, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                          <TableCell>{fila.empleado || '(vacío)'}</TableCell>
                          <TableCell>{fila.monto || '-'}</TableCell>
                          <TableCell>{fila.fechaPago || '-'}</TableCell>
                          <TableCell><Badge variant="destructive" className="text-xs">{fila.error}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
