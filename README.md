# AutoKeep
**Tu vehículo, siempre al día.**

Aplicación móvil para administrar vehículos, choferes, kilometraje, mantenimiento y documentación con alertas.

## Stack
- React Native + Expo + Expo Router
- TypeScript
- EAS Build (APK/AAB)

## Funciones previstas
- Flota completa en la pantalla inicial; no abrir automáticamente el último vehículo.
- Registro de modelo, patente y uno o más choferes por vehículo.
- Seguimiento manual del odómetro con periodicidad seleccionable de 12 o 24 horas.
- Mantenimiento de aceite con intervalos seleccionables de 8.000 o 13.000 km.
- Documentación vehicular, fotos, vencimientos y notificaciones configurables.
- Historial, idiomas y política de privacidad.
- Monetización con AdMob: intersticial al inicio y al navegar, sin bloquear la app si el anuncio no está disponible.

## Desarrollo
```bash
npm install
npx expo start
```

Los datos de kilometraje, mantenimiento y documentos deben estar asociados al vehículo y no al chofer.