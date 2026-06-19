import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import admin from 'firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filas } = body;

    if (!filas || !Array.isArray(filas) || filas.length === 0) {
      return NextResponse.json(
        { error: 'No hay datos para procesar' },
        { status: 400 }
      );
    }

    const results = [];
    const logs = [];

    for (const fila of filas) {
      try {
        const counterRef = adminDb.collection('contadores').doc('vale_counter');

        const nuevoNumero = await adminDb.runTransaction(async (transaction) => {
          const counterDoc = await transaction.get(counterRef);
          let ultimoNumero = 0;

          if (!counterDoc.exists) {
            transaction.set(counterRef, { ultimoNumero: 0 });
          } else {
            ultimoNumero = counterDoc.data().ultimoNumero;
          }

          const siguiente = ultimoNumero + 1;
          transaction.update(counterRef, { ultimoNumero: siguiente });
          return siguiente;
        });

        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const correlativo = String(nuevoNumero).padStart(5, '0');
        const numeroVale = `FALPAT-${year}-${month}-${correlativo}`;

        const valeDoc = {
          numero: numeroVale,
          empleado: fila.empleado,
          monto: fila.monto,
          fechaPago: fila.fechaPago,
          fechaGeneracion: admin.firestore.FieldValue.serverTimestamp(),
          estado: 'pendiente',
          mesDescuento: '',
        };

        const docRef = await adminDb.collection('vales').add(valeDoc);

        results.push({
          id: docRef.id,
          numero: numeroVale,
          empleado: fila.empleado,
          monto: fila.monto,
          fechaPago: fila.fechaPago,
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
        logs.push({ tipo: 'error', mensaje: `Error al procesar ${fila.empleado}: ${errorMsg}` });

        await adminDb.collection('logs').add({
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          tipo: 'error',
          mensaje: `Error al procesar vale para ${fila.empleado}: ${errorMsg}`,
          datos: fila,
        });
      }
    }

    return NextResponse.json(
      {
        message: `${results.length} vales creados exitosamente`,
        vales: results,
        total: results.length,
        logs,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error en upload:', error);
    return NextResponse.json(
      { error: 'Error al procesar la carga' },
      { status: 500 }
    );
  }
}
