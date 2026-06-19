import React from 'react';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { Vale, ConfigEmpresa } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { numeroALetras } from '@/lib/pdf/numero-letras';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 9,
  },
  half: {
    height: '50%',
    padding: 10,
    position: 'relative',
  },
  cutLine: {
    borderTopWidth: 1,
    borderTopStyle: 'dashed',
    borderTopColor: '#999',
    marginVertical: 0,
    position: 'relative',
  },
  cutLineText: {
    position: 'absolute',
    right: 10,
    top: -6,
    fontSize: 7,
    color: '#999',
    backgroundColor: 'white',
    paddingHorizontal: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#1A2A3A',
  },
  logo: {
    width: 60,
    height: 60,
    backgroundColor: '#1A2A3A',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  logoTxt: {
    color: '#F5A623',
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A2A3A',
    textAlign: 'center',
  },
  tag: {
    backgroundColor: '#F5A623',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1A2A3A',
  },
  companyInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    padding: 6,
    backgroundColor: '#E8ECEF',
    borderRadius: 3,
  },
  companyText: {
    fontSize: 7,
    color: '#1A2A3A',
    lineHeight: 1.4,
  },
  bodySection: {
    marginBottom: 8,
  },
  valeNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A2A3A',
    textAlign: 'center',
    marginBottom: 4,
    padding: 4,
    backgroundColor: '#E8ECEF',
    borderRadius: 3,
  },
  label: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 1,
  },
  value: {
    fontSize: 10,
    color: '#1A2A3A',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  field: {
    width: '48%',
  },
  amountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    marginVertical: 4,
    backgroundColor: '#1A2A3A',
    borderRadius: 3,
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F5A623',
  },
  amountWords: {
    fontSize: 8,
    color: '#1A2A3A',
    marginBottom: 4,
    textAlign: 'center',
    padding: 3,
    backgroundColor: '#E8ECEF',
    borderRadius: 2,
    fontStyle: 'italic',
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  signatureBlock: {
    width: '45%',
    alignItems: 'center',
  },
  signatureLine: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#333',
    marginTop: 20,
    marginBottom: 2,
  },
  signatureLabel: {
    fontSize: 7,
    color: '#666',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 8,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 6,
    color: '#999',
  },
  qrPlaceholder: {
    width: 30,
    height: 30,
    backgroundColor: '#E8ECEF',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 2,
  },
  qrText: {
    fontSize: 4,
    color: '#666',
    textAlign: 'center',
  },
  divider: {
    marginVertical: 4,
  },
});

function ValeHalf({
  vale,
  config,
  etiqueta,
}: {
  vale: Vale;
  config: ConfigEmpresa;
  etiqueta: 'ORIGINAL' | 'COPIA';
}) {
  const fechaEmision = format(new Date(), "dd 'de' MMMM 'de' yyyy", {
    locale: es,
  });

  return (
    <View style={styles.half}>
      <View style={styles.header}>
        <View style={styles.logo}>
          <Text style={styles.logoTxt}>FALPAT{'\n'}SRL</Text>
        </View>
        <Text style={styles.title}>VALE DE PAGO</Text>
        <View style={styles.tag}>
          <Text>{etiqueta}</Text>
        </View>
      </View>

      <View style={styles.companyInfo}>
        <Text style={styles.companyText}>
          {config.nombre || 'FALPAT SRL'}{'\n'}
          {config.direccion || 'Dirección de la empresa'}{'\n'}
          Tel: {config.telefono || '(000) 000-0000'}
        </Text>
        <Text style={styles.companyText}>
          Email: {config.email || 'info@falpat.com'}{'\n'}
          CUIT: {config.cuit || '00-00000000-0'}
        </Text>
      </View>

      <View style={styles.bodySection}>
        <Text style={styles.valeNumber}>{vale.numero}</Text>

        <View style={styles.row}>
          <View style={styles.field}>
            <Text style={styles.label}>FECHA DE EMISIÓN</Text>
            <Text style={styles.value}>{fechaEmision}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>FECHA DE PAGO</Text>
            <Text style={styles.value}>{vale.fechaPago}</Text>
          </View>
        </View>

        <Text style={styles.label}>EMPLEADO</Text>
        <Text style={styles.value}>{vale.empleado}</Text>

        <Text style={styles.label}>CONCEPTO</Text>
        <Text style={styles.value}>
          {config.conceptoVale || 'Adelanto de sueldo / Vale de pago'}
        </Text>

        <View style={styles.amountBox}>
          <Text style={styles.amountText}>
            $ {vale.monto.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </View>

        <Text style={styles.amountWords}>
          SON: {numeroALetras(vale.monto)} PESOS ARGENTINOS
        </Text>
      </View>

      <View style={styles.signatureSection}>
        <View style={styles.signatureBlock}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureLabel}>FIRMA DEL EMPLEADO</Text>
          <Text style={styles.signatureLabel}>Aclaración: {vale.empleado}</Text>
          <Text style={styles.signatureLabel}>DNI:</Text>
        </View>
        <View style={styles.signatureBlock}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureLabel}>FIRMA Y SELLO DE LA EMPRESA</Text>
          <Text style={styles.signatureLabel}>FALPAT SRL</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text>Vale válido por 30 días desde su emisión</Text>
        <Text>Vale Nro: {vale.numero}</Text>
        <View style={styles.qrPlaceholder}>
          <Text style={styles.qrText}>QR{'\n'}{vale.numero.slice(-6)}</Text>
        </View>
      </View>
    </View>
  );
}

export default function ValeTemplate({
  vale,
  config,
}: {
  vale: Vale;
  config: ConfigEmpresa;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <ValeHalf vale={vale} config={config} etiqueta="ORIGINAL" />
        <View style={styles.cutLine}>
          <Text style={styles.cutLineText}>- - - - - CORTE AQUÍ - - - - -</Text>
        </View>
        <ValeHalf vale={vale} config={config} etiqueta="COPIA" />
      </Page>
    </Document>
  );
}
