import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const docRef = adminDb.collection('vales').doc(params.id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Vale no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ id: doc.id, ...doc.data() }, { status: 200 });
  } catch (error) {
    console.error('Error al obtener vale:', error);
    return NextResponse.json({ error: 'Error al obtener vale' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { estado, mesDescuento } = body;

    const updateData: Record<string, unknown> = {};
    if (estado) updateData.estado = estado;
    if (mesDescuento !== undefined) updateData.mesDescuento = mesDescuento;

    await adminDb.collection('vales').doc(params.id).update(updateData);

    return NextResponse.json(
      { message: 'Vale actualizado exitosamente' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al actualizar vale:', error);
    return NextResponse.json(
      { error: 'Error al actualizar vale' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await adminDb.collection('vales').doc(params.id).delete();
    return NextResponse.json(
      { message: 'Vale eliminado exitosamente' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al eliminar vale:', error);
    return NextResponse.json(
      { error: 'Error al eliminar vale' },
      { status: 500 }
    );
  }
}
