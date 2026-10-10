# Contemplación

Landing en español con los activos originales del proyecto. Vinext/React, CSS y Lenis; video controlado por scroll en escritorio y reproducción normal en móvil. `prefers-reduced-motion` muestra un fotograma fijo y elimina el desplazamiento animado.

## Captura de correos

`POST /api/subscribe` guarda un correo único en D1 antes de confirmar el envío. Valida correo y consentimiento, limita el tamaño de petición e intentos por hora y utiliza un campo antispam. No expone una lista pública de suscriptores. No envía correos automáticamente.

## Conexión con GoHighLevel

Configura la variable secreta `GHL_WEBHOOK_URL` con la URL HTTPS del trigger **Inbound Webhook** de un workflow en la subcuenta correspondiente. Nunca coloques esa URL en el código del navegador. En GHL, configura la acción de crear/actualizar contacto mapeando `email` y añade la etiqueta `lista-espera`. Publica el workflow y verifica con un contacto de prueba autorizado.

Payload: `email`, `source`, `tags`, `consent`, `consent_version`, `created_at`, `event_id`. El ID es estable para cada correo. El estado `sent` significa aceptación HTTP del webhook, no envío de correo ni prueba de la creación del contacto en GHL.

Sin webhook, la captura sigue guardándose en D1 con `ghl_status=pending`. También conserva este estado si GHL no está disponible. La conexión necesita configuración externa: no se ha simulado una integración activa. Reintentar una suscripción vuelve a intentar entregar el pendiente. Los pendientes anteriores deben sincronizarse al conectar GHL; esta versión no tiene reintentos automáticos ni procesos programados.

Fuentes de configuración GHL: https://help.gohighlevel.com/support/solutions/articles/155000003147-trigger-inbound-webhook

## Datos editoriales pendientes

La región, el correo de contacto y los enlaces sociales no fueron proporcionados. Se omiten hasta disponer de los datos reales.

## Desarrollo

`npm ci`, `npm run dev`, `npm run build`. Migraciones generadas con `npm run db:generate`. Los recursos de marca proceden del PDF y los dos videos facilitados; no se utiliza stock. Las fuentes Marcellus y Jost se sirven localmente.
