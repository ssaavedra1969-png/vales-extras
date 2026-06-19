import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import admin from 'firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');
    const empleado = searchParams.get('empleado');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    let query: admin.firestore.Query = adminDb
      .collection('vales')
      .orderBy('numero', 'desc');

    if (estado && estado !== 'todos') {
      query = query.where('estado', '==', estado);
    }

    if (empleado) {
      query = query
        .where('empleado', '>=', empleado)
        .where('empleado', '<=', empleado + '\uf8ff');
    }

    const snapshot = await query
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .get();

    const totalSnapshot = await adminDb.collection('vales').get();
    const total = totalSnapshot.size;

    const vales = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ vales, total, page, pageSize }, { status: 200 });
  } catch (error) {
    console.error('Error al listar vales:', error);
    return NextResponse.json(
      { error: 'Error al obtener vales' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vales: valesData } = body;

    if (!valesData || !Array.isArray(valesData) || valesData.length === 0) {
      return NextResponse.json(
        { error: 'Datos de vales inválidos' },
        { status: 400 }
      );
    }

    const results = [];

    for (const data of valesData) {
      try {
        const counterRef = adminDb.collection('contadores').doc('vale_counter');

        const nuevoNumero = await adminDb.runTransaction(async (transaction) => {
          const counterDoc = await transaction.get(counterRef);
          let ultimoNumero = 0;

          if (!counterDoc.exists) {
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
        const numeroVale = `FALPAT-${year}-${month}-${correlativo}`;

        const valeDoc = {
          numero: numeroVale,
          empleado: data.empleado,
          monto: data.monto,
          fechaPago: data.fechaPago,
          fechaGeneracion: admin.firestore.FieldValue.serverTimestamp(),
          estado: 'pendiente',
          mesDescuento: '',
        };

        const docRef = await adminDb.collection('vales').add(valeDoc);

        results.push({
          id: docRef.id,
          numero: numeroVale,
          empleado: data.empleado,
          monto: data.monto,
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error desconocido';

        await adminDb.collection('logs').add({
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          tipo: 'error',
          mensaje: `Error al procesar vale para ${data.empleado}: ${errorMsg}`,
          datos: data,
        });
      }
    }

    return NextResponse.json(
      {
        message: `${results.length} vales creados exitosamente`,
        vales: results,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error al crear vales:', error);
    return NextResponse.json(
      { error: 'Error al crear vales' },
      { status: 500 }
    );
  }
}
