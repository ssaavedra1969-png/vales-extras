import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}/databases/(default)/documents`;

async function fetchFirestore(path: string, options?: RequestInit) {
  const url = API_KEY
    ? `${FIRESTORE_BASE_URL}/${path}?key=${API_KEY}`
    : `${FIRESTORE_BASE_URL}/${path}`;
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
}

export async function GET() {
  try {
    const res = await fetchFirestore('config/empresa');
    if (!res.ok) {
      if (res.status === 404) {
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
      throw new Error(`Firestore responded with ${res.status}`);
    }

    const data = await res.json();
    const fields = data.fields || {};

    return NextResponse.json(
      {
        nombre: fields.nombre?.stringValue || 'FALPAT SRL',
        direccion: fields.direccion?.stringValue || '',
        telefono: fields.telefono?.stringValue || '',
        email: fields.email?.stringValue || '',
        cuit: fields.cuit?.stringValue || '',
        conceptoVale: fields.conceptoVale?.stringValue || 'Adelanto de sueldo / Vale de pago',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al obtener configuración:', error);
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

    const fields: Record<string, { stringValue: string }> = {};
    if (nombre) fields.nombre = { stringValue: nombre };
    if (direccion) fields.direccion = { stringValue: direccion };
    if (telefono) fields.telefono = { stringValue: telefono };
    if (email) fields.email = { stringValue: email };
    if (cuit) fields.cuit = { stringValue: cuit };
    if (conceptoVale) fields.conceptoVale = { stringValue: conceptoVale };

    const res = await fetchFirestore('config/empresa', {
      method: 'PATCH',
      body: JSON.stringify({ fields }),
    });

    if (!res.ok && res.status === 404) {
      await fetchFirestore('config', {
        method: 'POST',
        body: JSON.stringify({
          fields,
          name: 'empresa',
        }),
      });
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
