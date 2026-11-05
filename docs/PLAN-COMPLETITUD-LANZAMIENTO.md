# AutoKeep — Plan de completitud y lanzamiento

Rama de trabajo: `feat/realistic-icon-splash`
Paquete Android: `com.eze2122.autokeep`
Referencia de primera APK: `AK-APK-001`

Este documento es el checklist de entrega. No se declara una etapa completada hasta comprobarla con código, pruebas o un build verificable.

## Etapa 1 — Auditoría y configuración base
- [x] Inspeccionar estructura, rutas, tipos, almacenamiento local y configuración Expo.
- [x] Definir perfil de build APK en GitHub Actions.
- [ ] Asegurar que todas las dependencias de Expo estén declaradas en package.json (incluido expo-splash-screen).
- [ ] Revisar app.json, ícono, splash, Android package, versionCode, permisos y configuración de notificaciones.
- [ ] Añadir lockfile reproducible (npm lockfile) y usar npm ci en CI.
- [ ] Configurar TypeScript y lint/test scripts reproducibles.

## Etapa 2 — Funciones de producto
- [ ] Flota: alta, lectura, edición y eliminación de vehículos; evitar patentes duplicadas.
- [ ] Conductores: alta, edición, eliminación y asociación por vehículo.
- [ ] Odómetro: registros por vehículo, fecha/hora, validaciones y edición/eliminación segura.
- [ ] Recordatorios de odómetro 12/24h con habilitación individual y notificación local.
- [ ] Mantenimiento: historial de servicios y recordatorio de aceite configurable a 8.000/13.000 km.
- [ ] Documentos: categorías, documento personalizado, fecha de vencimiento, foto y eliminación.
- [ ] Notificaciones de vencimiento con anticipación configurable (1/3/7/15/30 días).
- [ ] Historial unificado por vehículo.
- [ ] Configuración e idioma: traducción real de pantallas (español/inglés), no solo guardar preferencia.
- [ ] Política de privacidad accesible desde la app y publicada en una URL.
- [ ] Persistencia robusta, manejo de errores y confirmaciones; los datos se vinculan al vehículo, no al chofer.

## Etapa 3 — Monetización (integrar solo después de validar el núcleo)
- [ ] Integrar AdMob mediante SDK compatible con Expo/RN y configurar IDs de prueba.
- [ ] Definir colocaciones de anuncios y respetar la regla: nunca bloquear navegación o funciones si el anuncio no carga.
- [ ] Evaluar banner e intersticiales según el diseño/consentimiento y políticas de Google Play.
- [ ] Configurar consentimiento/privacidad publicitaria y app-ads.txt si corresponde.
- [ ] Premium sin anuncios: definir producto y conectar compras/validación antes de retirar anuncios; no mostrar una suscripción ficticia.
- [ ] Verificar anuncios de prueba antes de usar IDs de producción.

## Etapa 4 — QA y APK
- [ ] Ejecutar typecheck y pruebas automatizadas.
- [ ] Compilar APK en GitHub Actions; guardar cada build como artefacto versionado AK-APK-NNN sin sobrescribir anteriores.
- [ ] Instalar y probar en Android: primera ejecución, navegación, persistencia tras reinicio, flota, choferes, kilometraje, mantenimiento, documentos, fotos, alertas, idioma y fallos sin red.
- [ ] Registrar errores, corregir y generar la siguiente referencia APK.
- [ ] Confirmar estabilidad funcional antes de avanzar a AAB.

## Etapa 5 — Preparación de publicación
- [ ] Incrementar versionName/versionCode de forma controlada.
- [ ] Generar AAB firmado y verificar paquete/versión.
- [ ] Completar ficha Play Store, capturas, descripción, clasificación, privacidad y declaraciones de datos.
- [ ] Revisar requisitos de testing, políticas y estado de Play Console.
- [ ] Publicar solo con aprobación explícita del propietario.

## Estado actual observado
La aplicación tiene pantallas iniciales para flota, registro de vehículo, kilometraje/intervalo de aceite, documentos y ajustes. Aún hay funciones sin completar (por ejemplo, edición/eliminación de vehículos, notificaciones reales, traducción integral, política de privacidad publicada y monetización). Los builds de Actions previos fallaron durante la preparación del proyecto Android; no existe todavía un APK generado/verificado.
