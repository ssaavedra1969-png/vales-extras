import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET() {
  try {
    const docRef = adminDb.collection('config').doc('empresa');
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        {
          nombre: 'FALPAT SRL',
          direccion: '',
          telefono: '',
          email: '',
          cuit: '',
          conceptoVale: 'Adelanto de sueldo / Vale de pago',
        },
        { status: 200 }
      );
    }

    return NextResponse.json(doc.data(), { status: 200 });
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    return NextResponse.json(
      { error: 'Error al obtener configuración' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { nombre, direccion, telefono, email, cuit, conceptoVale } = body;

    if (!nombre || !email) {
      return NextResponse.json(
        { error: 'Nombre y email son obligatorios' },
        { status: 400 }
      );
    }

    const docRef = adminDb.collection('config').doc('empresa');
    const doc = await docRef.get();

    if (doc.exists) {
      await docRef.update({ nombre, direccion, telefono, email, cuit, conceptoVale });
    } else {
      await docRef.set({ nombre, direccion, telefono, email, cuit, conceptoVale });
    }

    return NextResponse.json(
      { message: 'Configuración guardada exitosamente' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al guardar configuración:', error);
    return NextResponse.json(
      { error: 'Error al guardar configuración' },
      { status: 500 }
    );
  }
}
