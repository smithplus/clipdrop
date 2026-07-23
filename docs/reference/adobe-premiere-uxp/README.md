# Referencia oficial de Adobe Premiere UXP

ClipDrop se contrastó con la documentación y los ejemplos oficiales de Adobe
el 23 de julio de 2026. El repositorio no conserva copias completas de esas
fuentes para evitar duplicación, peso y documentación desactualizada.

## Fuentes

- [Premiere UXP API](https://developer.adobe.com/premiere-pro/uxp/)
- [Primer plugin UXP](https://developer.adobe.com/premiere-pro/uxp/plugins/)
- [Manifiesto UXP](https://developer.adobe.com/premiere-pro/uxp/plugins/concepts/manifest/)
- [WebView UXP](https://developer.adobe.com/premiere-pro/uxp/uxp-api/reference-js/global-members/html-elements/html-web-view-element)
- [Empaquetar un plugin](https://developer.adobe.com/premiere-pro/uxp/plugins/distribution/package/)
- [Instalar un plugin](https://developer.adobe.com/premiere-pro/uxp/plugins/distribution/install/)
- [Ejemplos oficiales](https://github.com/AdobeDocs/uxp-premiere-pro-samples)

## Patrones aplicados

- Manifiesto v5 con host `premierepro`.
- Permisos de red y WebView limitados por dominio.
- `Project.importFiles()` para importar resultados.
- `project.lockedAccess()` y transacciones para crear el bin.
- WebView local con puente de mensajes para el preview.

Antes de cada lanzamiento público se deben revisar nuevamente el manifiesto,
los permisos y las guías de distribución.
